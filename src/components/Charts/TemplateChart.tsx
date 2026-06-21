// @ts-nocheck
// DashInsight - Dynamic Chart Renderer
// Renders charts based on ChartTemplate from the database
// Supports both legacy (x/y field roles) and new (dimensions + measures) models

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { evaluateFormula, aggregateBy, aggregateByMultiMeasures, calculateTotals } from '../../utils/formulaEvaluator';
import type { ChartTemplate } from '../../services/api';

const COLORS = ['#276749', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#047857', '#065f46', '#064e3b'];
const MEASURE_COLORS = ['#276749', '#e11d48', '#7c3aed', '#ea580c', '#0284c7'];

interface DataRow {
  [key: string]: any;
}

interface TemplateChartProps {
  template: ChartTemplate;
  rows: DataRow[];
  metricView?: string;
  viewType?: string;
  fieldMapping?: Record<string, string>;
  sortOrder?: 'asc' | 'desc';
  showLabels?: boolean;
  percentageView?: boolean;
  dateGrouping?: string;
  showReferenceLine?: boolean;
  conditionalFormat?: boolean;
}

// Format numbers
const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
const shortCurrency = (val: number) => {
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}Jt`;
  if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}Rb`;
  return `Rp ${val}`;
};
const formatNumber = (val: number) => val.toLocaleString('id-ID');

// Detect if aggregation is a count type
const isCountAgg = (agg: string) => agg === 'count' || agg === 'count_distinct';
const formatPercent = (val: number) => `${val.toFixed(1)}%`;
const formatCurrencyForLabel = (val: number, agg: string) => isCountAgg(agg) ? formatNumber(val) : shortCurrency(val);

// Custom label for bar/line charts
const CustomBarLabel = ({ x, y, width, value, formatter }: any) => {
  if (!value || value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 6} fill="#374151" textAnchor="middle" fontSize={10} fontWeight={600}>
      {formatter ? formatter(value) : formatNumber(value)}
    </text>
  );
};
const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} fontSize={10} fontWeight={500}>
      {`${name} ${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

// Detect if aggregation is a count type

// Check if a new-style chart (dimensions + measures model)
function isNewStyleChart(fieldMapping: Record<string, string> = {}): boolean {
  return fieldMapping && '_dimensions' in fieldMapping && '_measures' in fieldMapping;
}

// Parse new-style chart config from fieldMapping
function parseNewStyleConfig(fieldMapping: Record<string, string>) {
  const dimCount = parseInt(fieldMapping['_dimensions'] || '0', 10);
  const meaCount = parseInt(fieldMapping['_measures'] || '0', 10);
  const dimensions: string[] = [];
  const measures: Array<{ field: string; aggregation: string; label: string }> = [];
  
  for (let i = 0; i < dimCount; i++) {
    const col = fieldMapping[`dim_${i}`];
    if (col) dimensions.push(col);
  }
  for (let i = 0; i < meaCount; i++) {
    const col = fieldMapping[`mea_${i}`];
    const agg = fieldMapping[`mea_${i}_agg`] || 'sum';
    if (col) {
      measures.push({
        field: col,
        aggregation: agg,
        label: `${agg.toUpperCase()}(${col})`,
      });
    }
  }
  return { dimensions, measures };
}

// Determine which field to use for chart based on template fields (legacy mode)
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

  const availableFields = rows.length > 0 ? Object.keys(rows[0]) : [];
  const label = field.field_label.toLowerCase();

  if (availableFields.includes(field.field_label)) return field.field_label;

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

// ============================================================
// NEW-STYLE TABLE: GROUP BY + calculated measures + subtotals
// ============================================================
function renderNewStyleTable(rows: DataRow[], dimensions: string[], measures: Array<{ field: string; aggregation: string; label: string }>, percentageView = false) {
  const grouped = aggregateByMultiMeasures(rows, dimensions, measures);
  const totals = calculateTotals(grouped, measures);
  const fmtCurrency = (val: number, agg: string) => isCountAgg(agg) ? formatNumber(val) : shortCurrency(val);

  // Calculate grand totals for percentage
  const grandTotals: Record<string, number> = {};
  measures.forEach(m => {
    const key = `${m.aggregation}(${m.field})`;
    grandTotals[key] = totals[key] || 0;
  });

  return (
    <div className="max-h-[350px] overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left uppercase tracking-wider border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            {dimensions.map(d => (
              <th key={d} className="px-3 py-2 font-bold text-gray-600">{d}</th>
            ))}
            {measures.map(m => (
              <th key={m.label} className="px-3 py-2 font-bold text-emerald-700 text-right">{m.label}</th>
            ))}
            {percentageView && measures.length > 0 && (
              <th className="px-3 py-2 font-bold text-amber-600 text-right">% Total</th>
            )}
            <th className="px-3 py-2 font-bold text-gray-500 text-right">Baris</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
              {dimensions.map(d => (
                <td key={d} className="px-3 py-2 text-gray-700 font-medium">{row[d] ?? '-'}</td>
              ))}
              {measures.map(m => {
                const key = `${m.aggregation}(${m.field})`;
                const val = row[key] || 0;
                return (
                  <td key={m.label} className="px-3 py-2 text-right font-mono tabular-nums">
                    <span className={val > 0 ? 'text-emerald-700' : val < 0 ? 'text-rose-600' : 'text-gray-500'}>
                      {fmtCurrency(val, m.aggregation)}
                    </span>
                  </td>
                );
              })}
              {percentageView && measures.length > 0 && (() => {
                const firstKey = `${measures[0].aggregation}(${measures[0].field})`;
                const val = row[firstKey] || 0;
                const total = grandTotals[firstKey] || 1;
                const pct = ((val / Math.abs(total)) * 100);
                return (
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-amber-600">
                    {pct.toFixed(1)}%
                  </td>
                );
              })()}
              <td className="px-3 py-2 text-right text-gray-500 font-mono">{row.__count || row.__rows}</td>
            </tr>
          ))}
          {/* TOTALS ROW */}
          <tr className="border-t-2 border-emerald-200 bg-emerald-50 font-bold">
            {dimensions.map((d, i) => (
              <td key={d} className="px-3 py-2 text-emerald-800">
                {i === 0 ? 'TOTAL' : ''}
              </td>
            ))}
            {measures.map(m => {
              const key = `${m.aggregation}(${m.field})`;
              const val = totals[key] || 0;
              return (
                <td key={m.label} className="px-3 py-2 text-right font-mono text-emerald-800">
                  {fmtCurrency(val, m.aggregation)}
                </td>
              );
            })}
            {percentageView && <td className="px-3 py-2 text-right font-mono text-amber-600">100.0%</td>}
            <td className="px-3 py-2 text-right font-mono text-gray-500">
              {grouped.reduce((s, g) => s + (g.__count || g.__rows || 0), 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// NEW-STYLE BAR CHART: grouped bars (multi-measure)
// ============================================================
function renderNewStyleBar(rows: DataRow[], dimensions: string[], measures: Array<{ field: string; aggregation: string; label: string }>, showLabels = false, percentageView = false, totalOfAll = 0) {
  const grouped = aggregateByMultiMeasures(rows, dimensions, measures);
  const data = grouped.slice(0, 20).map(g => {
    const item: any = { name: g.__dimKey };
    measures.forEach(m => {
      const rawVal = g[`${m.aggregation}(${m.field})`] || 0;
      item[m.label] = percentageView && totalOfAll > 0 ? (rawVal / Math.abs(totalOfAll) * 100) : rawVal;
    });
    return item;
  });
  const isAnyCount = measures.some(m => isCountAgg(m.aggregation));
  const fmt = percentageView ? formatPercent : (isAnyCount ? formatNumber : shortCurrency);

  const avgValue = measures.length > 0 ? data.reduce((s, d) => s + (d[measures[0].label] || 0), 0) / (data.length || 1) : 0;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(val: number) => [fmt(val), '']} />
        {measures.length > 1 && <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />}
        {showReferenceLine && avgValue > 0 && (
          <ReferenceLine y={avgValue} stroke="#e11d48" strokeDasharray="4 4" strokeWidth={1.5}
            label={{ value: `Avg: ${fmt(avgValue)}`, position: 'right', fontSize: 10, fill: '#e11d48', fontWeight: 600 }} />
        )}
        {measures.map((m, idx) => (
          <Bar key={m.label} dataKey={m.label} name={m.label} fill={MEASURE_COLORS[idx % MEASURE_COLORS.length]}
            radius={idx === measures.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} barSize={measures.length > 1 ? 16 : 24}
            label={showLabels && data.length <= 15 ? { position: 'top', formatter: (val: number) => fmt(val), fontSize: 9, fill: '#374151', fontWeight: 600 } : false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// NEW-STYLE LINE CHART: multiple lines (multi-measure)
// ============================================================
function renderNewStyleLine(rows: DataRow[], dimensions: string[], measures: Array<{ field: string; aggregation: string; label: string }>, showLabels = false, percentageView = false, totalOfAll = 0) {
  const grouped = aggregateByMultiMeasures(rows, dimensions, measures);
  const data = grouped.slice(0, 30).map(g => {
    const item: any = { name: g.__dimKey };
    measures.forEach(m => {
      const rawVal = g[`${m.aggregation}(${m.field})`] || 0;
      item[m.label] = percentageView && totalOfAll > 0 ? (rawVal / Math.abs(totalOfAll) * 100) : rawVal;
    });
    return item;
  });
  const isAnyCount = measures.some(m => isCountAgg(m.aggregation));
  const fmt = percentageView ? formatPercent : (isAnyCount ? formatNumber : shortCurrency);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(val: number) => [fmt(val), '']} />
        {measures.length > 1 && <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />}
        {measures.map((m, idx) => (
          <Line key={m.label} type="monotone" dataKey={m.label} name={m.label}
            stroke={MEASURE_COLORS[idx % MEASURE_COLORS.length]} strokeWidth={2.5}
            dot={{ r: measures.length === 1 ? 4 : 3, fill: MEASURE_COLORS[idx % MEASURE_COLORS.length] }}
            label={showLabels && data.length <= 15 ? { position: 'top', formatter: (val: number) => fmt(val), fontSize: 9, fill: '#374151', fontWeight: 600 } : false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// NEW-STYLE PIE/DOUGHNUT: first dimension + first measure
// ============================================================
function renderNewStylePie(rows: DataRow[], dimensions: string[], measures: Array<{ field: string; aggregation: string; label: string }>, isDoughnut: boolean, showLabels = false) {
  const dimField = dimensions[0];
  const m = measures[0];
  if (!dimField || !m) return <div className="text-sm text-gray-400 p-4">Pilih minimal 1 dimensi dan 1 ukuran.</div>;

  const data = aggregateBy(rows, dimField, m.field, m.aggregation as any).slice(0, 8);
  const isC = isCountAgg(m.aggregation);

  const getSemanticColor = (name: string, idx: number) => {
    const n = name.toLowerCase();
    if (n.includes('batal') || n.includes('cancel') || n.includes('gagal')) return '#ef4444';
    if (n.includes('selesai') || n.includes('success') || n.includes('berhasil')) return '#10b981';
    if (n.includes('proses') || n.includes('pending')) return '#f59e0b';
    return COLORS[idx % COLORS.length];
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={isDoughnut ? 60 : 0}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          paddingAngle={isDoughnut ? 2 : 0}
          label={showLabels ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)` : false}
        >
          {data.map((entry, idx) => (
            <Cell key={idx} fill={getSemanticColor(entry.name, idx)} />
          ))}
        </Pie>
        <Tooltip formatter={(val: number) => isC ? formatNumber(val) : formatRupiah(val)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Render based on chart_type
// ============================================================
export function TemplateChart({ template, rows, metricView = 'revenue', viewType = 'auto', fieldMapping = {}, sortOrder = 'desc', showLabels = false, percentageView = false, dateGrouping }: TemplateChartProps) {
  if (!rows.length) {
    return <div className="flex items-center justify-center h-48 text-sm text-gray-400">Tidak ada data untuk chart ini.</div>;
  }

  // === NEW-STYLE: dimensions + measures model ===
  if (isNewStyleChart(fieldMapping)) {
    const { dimensions, measures } = parseNewStyleConfig(fieldMapping);
    if (!dimensions.length || !measures.length) {
      return <div className="flex items-center justify-center h-48 text-sm text-gray-400">Konfigurasi chart belum lengkap. Pilih minimal 1 dimensi dan 1 ukuran.</div>;
    }

    const chartType = viewType === 'auto' ? template.chart_type?.toLowerCase() : viewType;

    // Apply sort to grouped data
    let sortedRows = [...rows];
    if (measures.length > 0) {
      const m = measures[0];
      sortedRows.sort((a, b) => {
        const va = Number(a[m.field]) || 0;
        const vb = Number(b[m.field]) || 0;
        return sortOrder === 'asc' ? va - vb : vb - va;
      });
    }

    // Calculate totals for percentage view
    const totalOfAll = percentageView && measures.length > 0
      ? sortedRows.reduce((s, r) => s + (Number(r[measures[0].field]) || 0), 0)
      : 0;

    if (chartType === 'table') {
      return renderNewStyleTable(sortedRows, dimensions, measures, percentageView);
    }
    if (chartType === 'bar') {
      return renderNewStyleBar(sortedRows, dimensions, measures, showLabels, percentageView, totalOfAll);
    }
    if (chartType === 'line') {
      return renderNewStyleLine(sortedRows, dimensions, measures, showLabels, percentageView, totalOfAll);
    }
    if (chartType === 'pie' || chartType === 'doughnut') {
      return renderNewStylePie(sortedRows, dimensions, measures, chartType === 'doughnut', showLabels);
    }
    return renderNewStyleBar(sortedRows, dimensions, measures, showLabels, percentageView, totalOfAll);
  }

  // === LEGACY: x/y field role model ===
  const valueField = resolveField(template, 'y', rows, fieldMapping) || 'sales_amount';
  const labelField = resolveField(template, 'x', rows, fieldMapping) || 'category';

  const templateType = template.chart_type?.toLowerCase() || 'bar';
  const chartType = viewType === 'auto' ? templateType : viewType;

  // Composed chart
  if (chartType === 'composed') {
    const yBarField = resolveField(template, 'y_bar', rows, fieldMapping) || valueField;
    const yLineField = resolveField(template, 'y_line', rows, fieldMapping) || valueField;
    
    const grouped: Record<string, any> = {};
    rows.forEach(r => {
      let key = String(r[labelField] || 'N/A');
      if (template.chart_code === 'HOURLY_SALES' && key !== 'N/A') {
        const match = key.match(/(\d{1,2})[:.]/);
        if (match) {
           key = `${match[1].padStart(2, '0')}:00`;
        } else if (/^\d{1,2}$/.test(key.trim())) {
           key = `${key.trim().padStart(2, '0')}:00`;
        }
      }
      if (!grouped[key]) grouped[key] = { name: key, barVal: 0, lineVal: 0 };
      grouped[key].barVal += Number(r[yBarField]) || 0;
      grouped[key].lineVal += Number(r[yLineField]) || 0;
    });
    const data = Object.values(grouped).slice(0, 30);

    return (
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
          <YAxis yAxisId="left" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={formatNumber} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(val: number, name: string) => name === yBarField ? formatRupiah(val) : formatNumber(val)} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
          <Bar yAxisId="left" dataKey="barVal" name={template.chart_fields?.find(f => f.field_role === 'y_bar')?.field_label || yBarField} fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={24} />
          <Line yAxisId="right" type="monotone" dataKey="lineVal" name={template.chart_fields?.find(f => f.field_role === 'y_line')?.field_label || yLineField} stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4, fill: '#e11d48' }} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  // Horizontal bar
  if (chartType === 'horizontal_bar') {
    const data = aggregateBy(rows, labelField, valueField, (template.aggregation as any) || 'sum').sort((a,b) => b.value - a.value).slice(0, 10);
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

  // Scatter
  if (chartType === 'scatter') {
    const xField = resolveField(template, 'x', rows, fieldMapping) || 'quantity';
    const yField = resolveField(template, 'y', rows, fieldMapping) || 'gross_profit';
    const zField = resolveField(template, 'z', rows, fieldMapping) || 'sales_amount';
    const labelFieldScat = resolveField(template, 'label', rows, fieldMapping) || 'product_name';
    
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
            formatter={(val, name) => name === yField || name === zField ? formatRupiah(val) : formatNumber(val)}
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

  // Bar
  if (chartType === 'bar') {
    const agg = (template.aggregation as any) || 'sum';
    const isCount = isCountAgg(agg);
    const fmt = isCount ? formatNumber : shortCurrency;
    const data = aggregateBy(rows, labelField, valueField, agg);
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.slice(0, 30)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(val: number) => [fmt(val), isCount ? 'Jumlah' : 'Total']} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.slice(0, 30).map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Line
  if (chartType === 'line') {
    const agg = (template.aggregation as any) || 'sum';
    const isCount = isCountAgg(agg);
    const fmt = isCount ? formatNumber : shortCurrency;
    const data = aggregateBy(rows, labelField, valueField, agg);
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data.slice(0, 20)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(val: number) => [fmt(val), isCount ? 'Jumlah' : 'Total']} />
          <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2.5} dot={{ r: 4, fill: COLORS[0] }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Pie / Doughnut
  if (chartType === 'pie' || chartType === 'doughnut') {
    const agg = (template.aggregation as any) || 'sum';
    const isCount = isCountAgg(agg);
    const fmt = isCount ? formatNumber : shortCurrency;
    const data = aggregateBy(rows, labelField, valueField, agg).slice(0, 8);
    const getSemanticColor = (name: string, idx: number) => {
      const n = name.toLowerCase();
      if (n.includes('batal') || n.includes('cancel') || n.includes('gagal')) return '#ef4444';
      if (n.includes('selesai') || n.includes('success') || n.includes('berhasil')) return '#10b981';
      if (n.includes('proses') || n.includes('pending')) return '#f59e0b';
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
          <Tooltip formatter={(val: number) => isCount ? formatNumber(val) : formatRupiah(val)} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Legacy table: show raw columns
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

  // Circular progress
  if (chartType === 'circular_progress') {
    const data = aggregateBy(rows, labelField, valueField, (template.aggregation as any) || 'sum');
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const targetField = template.chart_fields?.find(f => f.field_role === 'target');
    const target = targetField ? (fieldMapping[targetField.id] || targetField.field_label) : null;
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
  const dataFallback = aggregateBy(rows, labelField, valueField, (template.aggregation as any) || 'sum');
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={dataFallback.slice(0, 30)} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
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
