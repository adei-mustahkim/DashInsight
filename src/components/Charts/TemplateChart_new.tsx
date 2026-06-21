import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { aggregateBy } from '../../utils/formulaEvaluator';
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

function resolveField(template: ChartTemplate, role: string, rows: DataRow[], fieldMapping: Record<string, string> = {}): string | null {
  let field = template.chart_fields?.find(f => f.field_role === role);
  if (!field) return null;
  const mappedField = fieldMapping[field.id] || fieldMapping[field.field_label];
  if (mappedField) return mappedField;
  const availableFields = rows.length > 0 ? Object.keys(rows[0]) : [];
  if (availableFields.includes(field.field_label)) return field.field_label;
  return availableFields[0] || null;
}

export function TemplateChart({ template, rows, metricView = 'revenue', viewType = 'auto', fieldMapping = {} }: TemplateChartProps) {
  if (!rows.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-gray-400">Tidak ada data untuk chart ini.</div>;
  }

  const templateType = template.chart_type?.toLowerCase() || 'bar';
  const chartType = viewType === 'auto' ? templateType : viewType;

  // Resolve standard fields
  const labelField = resolveField(template, 'x', rows, fieldMapping) || 'category';
  const valueField = resolveField(template, 'y', rows, fieldMapping) || 'sales_amount';
  
  if (chartType === 'composed') {
    // Needs 2 Y-axes
    const yBarField = resolveField(template, 'y_bar', rows, fieldMapping) || valueField;
    const yLineField = resolveField(template, 'y_line', rows, fieldMapping) || valueField;
    
    // Custom grouping? No, let's aggregate manually
    const grouped = {};
    rows.forEach(r => {
      const key = r[labelField] || 'Unknown';
      if (!grouped[key]) grouped[key] = { name: key, barVal: 0, lineVal: 0 };
      grouped[key].barVal += Number(r[yBarField]) || 0;
      grouped[key].lineVal += Number(r[yLineField]) || 0;
    });
    const data = Object.values(grouped);

    return (
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data.slice(0, 20)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} />
          <YAxis yAxisId="left" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(val: number) => formatRupiah(val)} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
          <Bar yAxisId="left" dataKey="barVal" name={yBarField} fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={16} />
          <Line yAxisId="right" type="monotone" dataKey="lineVal" name={yLineField} stroke="#e11d48" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'horizontal_bar') {
    const data = aggregateBy(rows, labelField, valueField, 'sum').sort((a,b) => b.value - a.value).slice(0, 15);
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
          <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(val: number) => formatRupiah(val)} />
          <Bar dataKey="value" name={valueField} fill={COLORS[0]} radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Fallback to simple charts
  const data = aggregateBy(rows, labelField, valueField, 'sum');
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data.slice(0, 15)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill={COLORS[0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default TemplateChart;
