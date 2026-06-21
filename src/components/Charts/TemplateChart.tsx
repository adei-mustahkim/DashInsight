// @ts-nocheck
// DashInsight - Dynamic Chart Renderer
// Renders charts based on ChartTemplate from the database

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
    'color': ['category', 'channel', 'branch'],
    'value': ['sales_amount', 'quantity', 'unit_price'],
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

  if (chartType === 'bar') {
    const data = aggregateBy(rows, labelField, valueField, 'sum');
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.slice(0, 15)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)} />
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
          <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)} />
          <Line type="monotone" dataKey="value" stroke="#276749" strokeWidth={2.5} dot={{ r: 4, fill: '#276749' }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'pie' || chartType === 'doughnut') {
    const data = aggregateBy(rows, labelField, valueField, 'sum').slice(0, 8);
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
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)} />
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

  // Default: bar chart
  const data = aggregateBy(rows, labelField, valueField, 'sum');
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data.slice(0, 15)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="value" fill="#276749" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default TemplateChart;
