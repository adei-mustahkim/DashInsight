// @ts-nocheck
// DashInsight - Chart Options Menu
// Per-chart controls: sort, labels, percentage, export

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Tag, Percent, Download, ChevronDown, Image, FileSpreadsheet } from 'lucide-react';

interface ChartOptionsMenuProps {
  chartId: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (order: 'asc' | 'desc') => void;
  showLabels: boolean;
  onLabelsToggle: () => void;
  percentageView: boolean;
  onPercentageToggle: () => void;
  chartRef?: React.RefObject<HTMLDivElement>;
  chartTitle?: string;
  chartType?: string;
}

export function ChartOptionsMenu({
  chartId,
  sortOrder,
  onSortChange,
  showLabels,
  onLabelsToggle,
  percentageView,
  onPercentageToggle,
  chartRef,
  chartTitle = 'Chart',
  chartType = 'chart',
}: ChartOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Export as PNG using html2canvas
  const exportPNG = async () => {
    if (!chartRef?.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = `${chartTitle.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export PNG failed:', err);
    }
    setIsOpen(false);
  };

  // Export as CSV (for table charts)
  const exportCSV = () => {
    // Get table data from chartRef
    if (!chartRef?.current) return;
    const table = chartRef.current.querySelector('table');
    if (!table) {
      alert('Export CSV hanya tersedia untuk tipe Tabel');
      setIsOpen(false);
      return;
    }
    
    const rows = Array.from(table.querySelectorAll('tr'));
    const csvContent = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => `"${cell.textContent?.trim() || ''}"`).join(',');
    }).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `${chartTitle.replace(/\s+/g, '_')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        title="Opsi chart"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 min-w-[200px]">
          {/* Sort */}
          <button
            onClick={() => { onSortChange(sortOrder === 'asc' ? 'desc' : 'asc'); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span>Urutkan: {sortOrder === 'asc' ? 'A→Z (Naik)' : 'Z→A (Turun)'}</span>
          </button>

          {/* Data Labels */}
          <button
            onClick={() => { onLabelsToggle(); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <span>Label Data: {showLabels ? 'ON' : 'OFF'}</span>
            <span className={`ml-auto w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${showLabels ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${showLabels ? 'translate-x-3' : 'translate-x-0'}`} />
            </span>
          </button>

          {/* Percentage View */}
          <button
            onClick={() => { onPercentageToggle(); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Percent className="w-3.5 h-3.5 text-gray-400" />
            <span>Tampilan %: {percentageView ? 'Persentase' : 'Angka'}</span>
            <span className={`ml-auto w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${percentageView ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${percentageView ? 'translate-x-3' : 'translate-x-0'}`} />
            </span>
          </button>

          <div className="border-t border-gray-100 my-1" />

          {/* Export PNG */}
          <button
            onClick={exportPNG}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Image className="w-3.5 h-3.5 text-gray-400" />
            <span>Simpan sebagai PNG</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-gray-400" />
            <span>Simpan sebagai CSV</span>
          </button>
        </div>
      )}
    </div>
  );
}
