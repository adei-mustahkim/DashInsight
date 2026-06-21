// DynamicChart - Renders chart based on chart template configuration
// Supports: bar, line, pie, area, scatter, radar, treemap

import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar,
  Treemap, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { AlertCircle, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table } from 'lucide-react';
import type { ChartTemplate } from '../../services/api';
import type { FieldMapping, ClientChartConfig } from '../../types/clientDashboard';
import { processChartData, type ChartDataPoint } from '../../formulas/evaluator';
import { formatRupiah, formatNumber } from '../../utils/formatting';
import CircularProgress from './CircularProgress';

// Chart colors palette
const CHART_COLORS = [
  '#276749', // primary green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#10B981', // emerald
  '#6366F1', // indigo
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

interface DynamicChartProps {
  chartTemplate: ChartTemplate;
  chartConfig: ClientChartConfig;
  rows: Record<string, unknown>[];
  className?: string;
}

export default function DynamicChart({
  chartTemplate,
  chartConfig,
  rows,
  className = '',
}: DynamicChartProps) {
  const { fieldMapping } = chartConfig;

  // Process chart data
  const chartData = useMemo(() => {
    if (!rows.length) return [];

    try {
      return processChartData(chartTemplate, rows, fieldMapping, []);
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [chartTemplate, rows, fieldMapping]);

  // Determine which field to use for values
  const valueField = chartTemplate.chart_fields?.find(f => f.field_role === 'y')?.field_role || 'value';

  // Render based on chart type
  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-gray-400">
          <AlertCircle className="h-10 w-10 mb-2" />
          <p className="text-sm">Tidak ada data untuk ditampilkan</p>
          <p className="text-xs mt-1">Pastikan kolom sudah di-mapping dengan benar</p>
        </div>
      );
    }

    switch (chartTemplate.chart_type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'doughnut':
        return renderPieChart(true);
      case 'area':
        return renderAreaChart();
      case 'scatter':
        return renderScatterChart();
      case 'radar':
        return renderRadarChart();
      case 'treemap':
        return renderTreemap();
      case 'table':
        return renderTable();
      case 'circular_progress':
        return renderCircularProgress();
      default:
        return renderBarChart();
    }
  };

  // Bar Chart
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEF" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#667085' }}
          angle={-35}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis
          tickFormatter={(val) => formatCompactNumber(val)}
          tick={{ fontSize: 11, fill: '#667085' }}
          width={50}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip valueField={valueField} />} />
        <Bar dataKey={valueField} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  // Line Chart
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEF" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#667085' }}
          angle={-35}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis
          tickFormatter={(val) => formatCompactNumber(val)}
          tick={{ fontSize: 11, fill: '#667085' }}
          width={50}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip valueField={valueField} />} />
        <Line
          type="monotone"
          dataKey={valueField}
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS[0], strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Pie/Doughnut Chart
  const renderPieChart = (isDoughnut = false) => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData.slice(0, 8)}
          cx="50%"
          cy="50%"
          innerRadius={isDoughnut ? 50 : 0}
          outerRadius={80}
          paddingAngle={2}
          dataKey={valueField}
          nameKey="name"
        >
          {chartData.slice(0, 8).map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip valueField={valueField} />} />
      </PieChart>
    </ResponsiveContainer>
  );

  // Area Chart
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEF" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#667085' }}
          angle={-35}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis
          tickFormatter={(val) => formatCompactNumber(val)}
          tick={{ fontSize: 11, fill: '#667085' }}
          width={50}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip valueField={valueField} />} />
        <Area
          type="monotone"
          dataKey={valueField}
          stroke={CHART_COLORS[0]}
          fill={CHART_COLORS[0]}
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  // Scatter Chart
  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEF" />
        <XAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11, fill: '#667085' }}
          name="Name"
        />
        <YAxis
          dataKey={valueField}
          type="number"
          tickFormatter={(val) => formatCompactNumber(val)}
          tick={{ fontSize: 11, fill: '#667085' }}
          name="Value"
        />
        <Tooltip content={<CustomTooltip valueField={valueField} />} />
        <Scatter data={chartData.slice(0, 10)} fill={CHART_COLORS[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );

  // Radar Chart
  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData.slice(0, 8)}>
        <PolarGrid stroke="#E8ECEF" />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Radar
          name={chartTemplate.chart_name}
          dataKey={valueField}
          stroke={CHART_COLORS[0]}
          fill={CHART_COLORS[0]}
          fillOpacity={0.3}
        />
        <Tooltip content={<CustomTooltip valueField={valueField} />} />
      </RadarChart>
    </ResponsiveContainer>
  );

  // Treemap
  const renderTreemap = () => {
    const treemapData = chartData.slice(0, 10).map(d => ({
      name: d.name,
      size: (d[valueField] as number) || 0,
    }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="size"
          stroke="#fff"
          fill={CHART_COLORS[0]}
          content={<CustomTreemapContent />}
        />
      </ResponsiveContainer>
    );
  };

  // Table
  const renderTable = () => (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Nama</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-700">Nilai</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {chartData.slice(0, 10).map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-700">{item.name}</td>
              <td className="px-3 py-2 text-right font-medium text-gray-900">
                {formatCompactCurrency(item[valueField] as number)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Circular Progress
  const renderCircularProgress = () => {
    // Ambil nilai dari data baris pertama
    const value = chartData.length > 0 ? (chartData[0][valueField] as number) || 0 : 0;
    
    return (
      <div className="flex flex-col items-center justify-center h-full pt-4">
        <CircularProgress 
          value={value} 
          size={140} 
          color="#276749" 
        />
        {chartData.length > 0 && chartData[0].name && chartData[0].name !== 'Total' && (
          <p className="mt-4 text-sm text-gray-600 font-medium">{chartData[0].name}</p>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chart Title */}
      <div className="flex items-center gap-2 mb-3">
        <ChartTypeIcon type={chartTemplate.chart_type} className="h-4 w-4 text-emerald-600" />
        <h3 className="font-semibold text-gray-900">{chartTemplate.chart_name}</h3>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-0">
        {renderChart()}
      </div>

      {/* Legend / Summary */}
      {chartData.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {chartData.length} item · Total: {formatCompactCurrency(
            chartData.reduce((sum, d) => sum + ((d[valueField] as number) || 0), 0)
          )}
        </div>
      )}
    </div>
  );
}

// === Helper Components ===

function ChartTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'bar':
    case 'smart_pareto':
      return <BarChart3 className={className} />;
    case 'line':
    case 'area':
      return <LineChartIcon className={className} />;
    case 'pie':
    case 'doughnut':
    case 'circular_progress':
      return <PieChartIcon className={className} />;
    case 'table':
      return <Table className={className} />;
    default:
      return <BarChart3 className={className} />;
  }
}

// Custom Tooltip
function CustomTooltip({ active, payload, valueField }: { active?: boolean; payload?: { name: string; value: number }[]; valueField: string }) {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-900">{data?.name}</p>
      <p className="text-sm text-emerald-600 font-semibold">
        {formatCompactCurrency(data?.value || 0)}
      </p>
    </div>
  );
}

// Custom Treemap Content
function CustomTreemapContent({ x, y, width, height, name, value }: {
  x?: number; y?: number; width?: number; height?: number; name?: string; value?: number
}) {
  if (width && height && width > 50 && height > 30) {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{ fill: CHART_COLORS[Math.abs(name?.charCodeAt(0) || 0) % CHART_COLORS.length], stroke: '#fff', strokeWidth: 2 }}
        />
        {width > 60 && height > 40 && (
          <>
            <text x={(x || 0) + (width / 2)} y={(y || 0) + (height / 2) - 6} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={600}>
              {String(name).slice(0, Math.floor(width / 8))}
            </text>
            <text x={(x || 0) + (width / 2)} y={(y || 0) + (height / 2) + 8} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={10}>
              {formatCompactCurrency(value || 0)}
            </text>
          </>
        )}
      </g>
    );
  }
  return null;
}

// === Formatters ===

function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString('id-ID');
}

function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `Rp${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `Rp${(value / 1_000).toFixed(1)}K`;
  }
  return `Rp${value.toLocaleString('id-ID')}`;
}
