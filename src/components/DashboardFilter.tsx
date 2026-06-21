// @ts-nocheck
// DashInsight - Dashboard Filter Bar
// Global date range picker + dimension filters

import React, { useState, useMemo } from 'react';
import { Calendar, Filter, X, ChevronDown, RotateCcw } from 'lucide-react';
import type { DatePeriod } from '../utils/dateIntelligence';
import { detectDateColumns, getDateRange, getDatePresets } from '../utils/dateIntelligence';

interface DashboardFilterProps {
  rows: any[];
  dateRange: { from: string; to: string } | null;
  onDateRangeChange: (range: { from: string; to: string } | null) => void;
  dimensionFilters: Record<string, string[]>;
  onDimensionFilterChange: (col: string, values: string[]) => void;
  dateGrouping: Record<string, DatePeriod>;
  onDateGroupingChange: (chartId: string, period: DatePeriod) => void;
}

export function DashboardFilter({
  rows,
  dateRange,
  onDateRangeChange,
  dimensionFilters,
  onDimensionFilterChange,
  dateGrouping,
  onDateGroupingChange,
}: DashboardFilterProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  // Detect date columns from data
  const dateColumns = useMemo(() => detectDateColumns(rows), [rows]);
  const dateRangeInfo = useMemo(
    () => dateColumns.length > 0 ? getDateRange(rows, dateColumns[0]) : null,
    [rows, dateColumns]
  );
  const presets = useMemo(() => getDatePresets(), []);

  // Detect text columns for dimension filters
  const textColumns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0])
      .filter(c => !c.startsWith('__') && !dateColumns.includes(c))
      .filter(c => {
        const sample = rows.slice(0, 50).map(r => r[c]).filter(v => v !== null && v !== undefined && v !== '');
        const unique = new Set(sample.map(String));
        return unique.size > 1 && unique.size <= 50;
      })
      .slice(0, 8);
  }, [rows, dateColumns]);

  const activeFilterCount = Object.values(dimensionFilters).filter(v => v.length > 0).length + (dateRange ? 1 : 0);

  const clearAllFilters = () => {
    onDateRangeChange(null);
    textColumns.forEach(col => onDimensionFilterChange(col, []));
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center gap-3 sticky top-0 z-30" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Date Range */}
      {dateColumns.length > 0 && (
        <div className="relative flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {dateRange ? (
              <span>{dateRange.from} s/d {dateRange.to}</span>
            ) : (
              <span>Semua tanggal{dateRangeInfo ? ` (${dateRangeInfo.min} — ${dateRangeInfo.max})` : ''}</span>
            )}
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Presets dropdown */}
          {showPresets && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 min-w-[240px]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">Preset</div>
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => {
                    onDateRangeChange({ from: p.from, to: p.to });
                    setShowPresets(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-md transition-colors"
                >
                  {p.label}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">Custom</div>
                <div className="flex items-center gap-2 px-2">
                  <input
                    type="date"
                    value={dateRange?.from || ''}
                    onChange={e => onDateRangeChange({ from: e.target.value, to: dateRange?.to || '' })}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <span className="text-xs text-gray-400">—</span>
                  <input
                    type="date"
                    value={dateRange?.to || ''}
                    onChange={e => onDateRangeChange({ from: dateRange?.from || '', to: e.target.value })}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>
              {dateRange && (
                <button
                  onClick={() => { onDateRangeChange(null); setShowPresets(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md mt-1 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset ke semua tanggal
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dimension Filters */}
      {textColumns.slice(0, 4).map(col => {
        const uniqueVals = [...new Set(rows.slice(0, 200).map(r => String(r[col] || '')).filter(Boolean))].sort().slice(0, 30);
        const selected = dimensionFilters[col] || [];
        const isExpanded = expandedFilter === col;

        return (
          <div key={col} className="relative">
            <button
              onClick={() => setExpandedFilter(isExpanded ? null : col)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                selected.length > 0
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span className="max-w-[80px] truncate">{col}</span>
              {selected.length > 0 && (
                <span className="bg-emerald-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                  {selected.length}
                </span>
              )}
              <ChevronDown className="w-3 h-3" />
            </button>

            {isExpanded && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 min-w-[180px] max-h-[240px] overflow-auto">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{col}</span>
                  <button
                    onClick={() => onDimensionFilterChange(col, [])}
                    className="text-[10px] text-rose-500 hover:text-rose-700"
                  >
                    Reset
                  </button>
                </div>
                {uniqueVals.map(val => {
                  const isChecked = selected.length === 0 || selected.includes(val);
                  return (
                    <label key={val} className="flex items-center gap-2 px-1 py-1 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = selected.includes(val)
                            ? selected.filter(v => v !== val)
                            : [...selected, val];
                          // If all selected, treat as "no filter"
                          const allSelected = next.length === uniqueVals.length;
                          onDimensionFilterChange(col, allSelected ? [] : next);
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-gray-700 truncate">{val}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Active filter count + clear */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-gray-400 font-medium">{activeFilterCount} filter aktif</span>
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-700 font-medium"
          >
            <X className="w-3 h-3" /> Hapus semua
          </button>
        </div>
      )}
    </div>
  );
}
