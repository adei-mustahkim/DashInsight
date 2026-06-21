// @ts-nocheck
// DashInsight - Dynamic Chart Renderer
// Renders charts based on ChartTemplate from the database

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { evaluateFormula, aggregateBy } from '../../utils/formulaEvaluator';
import type { ChartTemplate } from '../../services/api';

const COLORS = ['#276749', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#047857', '#065f46', '#064e3b'];

interface DataRow {
  [key: string]: any;
}

interface TemplateChartProps {
  template: ChartTemplate;
  rows: DataRow[];
  metricView?: string;
  viewType?: string;
  fieldMapping?: Record<string, string>;
}

// Format numbers
const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
const shortCurrency = (val: number) => {
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}K`;
  return `Rp ${val}`;
};

// Determine which field to use for chart based on template fields
function resolveField(template: ChartTemplate, role: string, rows: DataRow[], fieldMapping: Record<string, string> = {}): string | null {
  let field = template.chart_fields?.find(f => f.field_role === role);
  let resolvedRole = role;
  if (!field) {
    if (role === 'x') {
      field = template.chart_fields?.find(f => f.field_role === 'label');
      if (field) resolvedRole = 'label';
    } else if (role === 'y') {
      field = template.chart_fields?.find(f => f.field_role === 'value');
      if (field) resolvedRole = 'value';
    }
  }
  if (!field) return null;

  const mappedField = fieldMapping[field.id] || fieldMapping[field.field_label];
  if (mappedField) return mappedField;

  // Try to match field_label to actual data columns
  const availableFields = rows.length > 0 ? Object.keys(rows[0]) : [];
  const label = field.field_label.toLowerCase();

  // Direct match
  if (availableFields.includes(field.field_label)) return field.field_label;

  // Fuzzy match by common patterns
  const patterns: Record<string, string[]> = {
    'x': ['category', 'product_name', 'name', 'date', 'branch', 'channel', 'payment_method', 'staff_name', 'city'],
    'y': ['sales_amount', 'quantity', 'unit_price', 'cogs', 'gross_profit', 'discount_amount'],
    'label': ['product_name', 'name', 'category', 'branch'],
    'color': ['category', 'channel', 'branch', 'status'],
    'value': ['sales_amount', 'quantity', 'unit_price'],
    'y_bar': ['sales_amount', 'gross_profit', 'revenue'],
    'y_line': ['quantity', 'transactions', 'roi']
  };

  const searchTerms = [label, ...(patterns[resolvedRole] || [])];
  for (const term of searchTerms) {
    const match = availableFields.find(f => f.toLowerCase().includes(term));
    if (match) return match;
  }

  return availableFields[0] || null;
}

// Render based on chart_type
export function TemplateChart({ template, rows, metricView = 'revenue', viewType = 'auto', fieldMapping = {} }: TemplateChartProps) {
  if (!rows.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-gray-400">Tidak ada data untuk chart ini.</div>;
  }

  const valueField = resolveField(template, 'y', rows, fieldMapping) || 'sales_amount';
  const labelField = resolveField(template, 'x', rows, fieldMapping) || 'category';
  const colorField = resolveField(template, 'color', rows, fieldMapping);

  const templateType = template.chart_type?.toLowerCase() || 'bar';
  const chartType = viewType === 'auto' ? templateType : viewType;

  if (chartType === 'composed') {
    const yBarField = resolveField(template, 'y_bar', rows, fieldMapping) || valueField;
    const yLineField = resolveField(template, 'y_line', rows, fieldMapping) || valueField;
    
    const grouped = {};
    rows.forEach(r => {
      const key = r[labelField] || 'Unknown';
      if (!grouped[key]) grouped[key] = { name: key, barVal: 0, lineVal: 0 };
      grouped[key].barVal += Number(r[yBarField]) || 0;
      grouped[key].lineVal += Number(r[yLineField]) || 0;
    });
    const data = Object.values(grouped).slice(0, 15);

    return (
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
          <YAxis yAxisId="left" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => val.toLocaleString('id-ID')} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(val: number, name: string) => name === yBarField ? formatRupiah(val) : val.toLocaleString('id-ID')} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
          <Bar yAxisId="left" dataKey="barVal" name={template.chart_fields?.find(f => f.field_role === 'y_bar')?.field_label || yBarField} fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={24} />
          <Line yAxisId="right" type="monotone" dataKey="lineVal" name={template.chart_fields?.find(f => f.field_role === 'y_line')?.field_label || yLineField} stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4, fill: '#e11d48' }} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'horizontal_bar') {
    const data = aggregateBy(rows, labelField, valueField, 'sum').sort((a,b) => b.value - a.value).slice(0, 10);
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
          <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(val: number) => formatRupiah(val)} />
          <Bar dataKey="value" name={valueField} fill={COLORS[0]} radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'scatter') {
    const xField = resolveField(template, 'x', rows, fieldMapping) || 'quantity';
    const yField = resolveField(template, 'y', rows, fieldMapping) || 'gross_profit';
    const zField = resolveField(template, 'z', rows, fieldMapping) || 'sales_amount';
    const labelFieldScat = resolveField(template, 'label', rows, fieldMapping) || 'product_name';
    
    // Aggregate by label first
    const grouped = {};
    rows.forEach(r => {
      const key = r[labelFieldScat] || 'Unknown';
      if (!grouped[key]) grouped[key] = { name: key, x: 0, y: 0, z: 0 };
      grouped[key].x += Number(r[xField]) || 0;
      grouped[key].y += Number(r[yField]) || 0;
      grouped[key].z += Number(r[zField]) || 0;
    });
    const data = Object.values(grouped).sort((a,b) => b.z - a.z).slice(0, 30);

    return (
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEF" />
          <XAxis type="number" dataKey="x" name={xField} tick={{ fontSize: 11, fill: '#667085' }} />
          <YAxis type="number" dataKey="y" name={yField} tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name={zField} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} 
            formatter={(val, name) => name === yField || name === zField ? formatRupiah(val) : val.toLocaleString('id-ID')}
            labelFormatter={() => ''}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-white p-2 border border-gray-100 shadow-sm rounded-md text-xs">
                    <p className="font-semibold text-gray-800 mb-1">{d.name}</p>
                    <p className="text-gray-600">{xField}: {d.x.toLocaleString('id-ID')}</p>
                    <p className="text-gray-600">{yField}: {formatRupiah(d.y)}</p>
                    <p className="text-gray-600">{zField}: {formatRupiah(d.z)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={data} fill={COLORS[0]} fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'bar') {
    const data = aggregateBy(rows, labelField, valueField, 'sum');
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.slice(0, 15)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
          <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(val: number) => formatRupiah(val)} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.slice(0, 15).map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    const data = aggregateBy(rows, labelField, valueField, 'sum');
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data.slice(0, 20)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(val: number) => formatRupiah(val)} />
          <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2.5} dot={{ r: 4, fill: COLORS[0] }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'pie' || chartType === 'doughnut') {
    const data = aggregateBy(rows, labelField, valueField, 'sum').slice(0, 8);
    // Semantic Colors for specific fields like status
    const getSemanticColor = (name: string, idx: number) => {
      const n = name.toLowerCase();
      if (n.includes('batal') || n.includes('cancel') || n.includes('gagal')) return '#ef4444'; // red
      if (n.includes('selesai') || n.includes('success') || n.includes('berhasil')) return '#10b981'; // green
      if (n.includes('proses') || n.includes('pending')) return '#f59e0b'; // yellow
      return COLORS[idx % COLORS.length];
    };

    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={chartType === 'doughnut' ? 60 : 0}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            paddingAngle={chartType === 'doughnut' ? 2 : 0}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={getSemanticColor(entry.name, idx)} />
            ))}
          </Pie>
          <Tooltip formatter={(val: number) => formatRupiah(val)} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'table') {
    const fields = template.chart_fields || [];
    const displayFields = fields.length > 0
      ? [...new Set(fields.map(field => fieldMapping[field.id] || fieldMapping[field.field_label] || field.field_label).filter(Boolean))]
          .filter(field => rows.some(row => row[field] !== undefined && row[field] !== null && row[field] !== ''))
      : Object.keys(rows[0] || {}).slice(0, 6);

    return (
      <div className="max-h-[300px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                {displayFields.map(f => <th key={f} className="px-3 py-2">{f}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                  {displayFields.map(f => (
                    <td key={f} className="px-3 py-2 text-gray-700">{row[f] === undefined || row[f] === null || row[f] === '' ? '' : typeof row[f] === 'number' ? row[f].toLocaleString('id-ID') : row[f]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    );
  }

  if (chartType === 'circular_progress') {
    const data = aggregateBy(rows, labelField, valueField, 'sum');
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const target = template.chart_fields?.find(f => f.field_role === 'target')?.field_label;
    const targetValue = target ? (Number(target) || total * 1.2) : total * 1.2;
    const percentage = Math.min(100, Math.round((total / targetValue) * 100)) || 0;

    return (
      <div className="flex flex-col items-center justify-center h-[280px]">
        <div className="relative flex items-center justify-center w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={COLORS[0]} strokeWidth="8" strokeDasharray={`${percentage * 2.827} 282.7`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
            <span className="text-xs text-gray-500 mt-1">{metricView}</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600 font-medium">Total: {formatRupiah(total)}</p>
      </div>
    );
  }

  // Fallback: bar chart
  const dataFallback = aggregateBy(rows, labelField, valueField, 'sum');
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={dataFallback.slice(0, 15)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default TemplateChart;
