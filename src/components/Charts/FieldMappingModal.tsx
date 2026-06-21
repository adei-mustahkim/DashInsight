// @ts-nocheck
// Field Mapping Modal - Map client columns to chart fields
// User selects which column from their data maps to each field required by the chart

import { useState, useCallback, useMemo } from 'react';
import { X, Check, AlertCircle, ChevronDown, Info } from 'lucide-react';
import type { ChartTemplate } from '../../services/api';
import type { FieldMapping, DataType } from '../../types/clientDashboard';
import {
  getAllFields,
  getRequiredFields,
  detectColumnDataType,
  getSampleValues,
  isDataTypeCompatible,
} from '../../types/clientDashboard';

interface FieldMappingModalProps {
  chartTemplate: ChartTemplate;
  clientHeaders: string[];
  clientRows: Record<string, unknown>[];
  existingMapping: FieldMapping;
  onSave: (mapping: FieldMapping) => void;
  onClose: () => void;
}

// Column type detection helper
function getColumnTypeLabel(type: DataType): string {
  const labels: Record<DataType, string> = {
    number: 'Angka',
    string: 'Teks',
    date: 'Tanggal',
    label: 'Label',
    any: 'Bebas',
  };
  return labels[type] || type;
}

function getColumnTypeColor(type: DataType): string {
  const colors: Record<DataType, string> = {
    number: 'bg-blue-100 text-blue-700',
    string: 'bg-gray-100 text-gray-700',
    date: 'bg-purple-100 text-purple-700',
    label: 'bg-green-100 text-green-700',
    any: 'bg-gray-100 text-gray-600',
  };
  return colors[type] || colors.any;
}

export default function FieldMappingModal({
  chartTemplate,
  clientHeaders,
  clientRows,
  existingMapping,
  onSave,
  onClose,
}: FieldMappingModalProps) {
  // Current mapping state
  const [mapping, setMapping] = useState<FieldMapping>(existingMapping);

  // Get all fields for this chart
  const allFields = useMemo(() => getAllFields(chartTemplate), [chartTemplate]);
  const requiredFields = useMemo(() => getRequiredFields(chartTemplate), [chartTemplate]);

  // Detect column types
  const columnTypes = useMemo(() => {
    const types: Record<string, DataType> = {};
    for (const header of clientHeaders) {
      const values = getSampleValues(clientRows, header, 20);
      types[header] = detectColumnDataType(values);
    }
    return types;
  }, [clientHeaders, clientRows]);

  // Handle mapping change
  const handleMappingChange = useCallback((fieldRole: string, column: string) => {
    setMapping(prev => ({
      ...prev,
      [fieldRole]: column || undefined,
    }));
  }, []);

  // Check if all required fields are mapped
  const isComplete = useMemo(() => {
    return requiredFields.every(field => mapping[field.field_role]);
  }, [requiredFields, mapping]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!isComplete) return;
    onSave(mapping);
  }, [isComplete, mapping, onSave]);

  // Get unmapped required fields
  const unmappedFields = useMemo(() => {
    return requiredFields.filter(field => !mapping[field.field_role]);
  }, [requiredFields, mapping]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Konfigurasi Chart</h2>
            <p className="mt-0.5 text-sm text-gray-600">{chartTemplate.chart_name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Info Banner */}
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Petunjuk Mapping</p>
                <p className="mt-1">
                  Pilih kolom dari dataset Anda yang sesuai dengan setiap field yang diperlukan oleh chart.
                  Sistem akan mencoba mendeteksi tipe data secara otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Field Mappings */}
          <div className="space-y-4">
            {allFields.map(field => {
              const currentMapping = mapping[field.field_role];
              const fieldType = field.required_data_type as DataType | null;
              const columnType = currentMapping ? columnTypes[currentMapping] : null;
              const isCompatible = fieldType && columnType
                ? isDataTypeCompatible(fieldType, columnType)
                : true;

              return (
                <div
                  key={field.field_role}
                  className={`rounded-lg border p-4 ${
                    field.is_required
                      ? unmappedFields.includes(field)
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-emerald-200 bg-emerald-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Field Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{field.field_label}</span>
                      {field.is_required && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Wajib
                        </span>
                      )}
                      {field.required_data_type && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getColumnTypeColor(fieldType!)}`}>
                          {getColumnTypeLabel(fieldType!)}
                        </span>
                      )}
                    </div>
                    {currentMapping && isCompatible && (
                      <span className="flex items-center gap-1 text-sm text-emerald-600">
                        <Check className="h-4 w-4" />
                        Terkonfigurasi
                      </span>
                    )}
                    {currentMapping && !isCompatible && (
                      <span className="flex items-center gap-1 text-sm text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        Tipe data tidak cocok
                      </span>
                    )}
                  </div>

                  {/* Column Selector */}
                  <div className="relative mt-3">
                    <select
                      value={currentMapping || ''}
                      onChange={e => handleMappingChange(field.field_role, e.target.value)}
                      className={`w-full appearance-none rounded-lg border py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 ${
                        !currentMapping
                          ? 'border-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-200'
                          : isCompatible
                            ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-200'
                            : 'border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-amber-200'
                      }`}
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {clientHeaders.map(header => {
                        const type = columnTypes[header];
                        const compatible = fieldType
                          ? isDataTypeCompatible(fieldType, type)
                          : true;
                        return (
                          <option key={header} value={header} disabled={!compatible}>
                            {header}
                            {type !== 'any' && ` (${getColumnTypeLabel(type)})`}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>

                  {/* Sample Values Preview */}
                  {currentMapping && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Contoh nilai:{' '}
                        <span className="text-gray-700">
                          {getSampleValues(clientRows, currentMapping, 3)
                            .map(v => String(v))
                            .join(', ')}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-600">
            {unmappedFields.length > 0 ? (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                {unmappedFields.length} field wajib belum di-mapping
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600">
                <Check className="h-4 w-4" />
                Semua field wajib sudah di-mapping
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!isComplete}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
