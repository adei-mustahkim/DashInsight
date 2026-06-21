import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload as UploadIcon, FileText } from 'lucide-react';
import { useAuth } from '../../stores/useAuth';
import { clientApi } from '../../services/api';
import { TEMPLATE_WORKBOOK_URL } from '../../lib/templateAssets';
import { mapRowsToCanonical, saveWorkspace, type ClientWorkspace } from '../../storage/clientWorkspace';
import type { DataRow } from '../../types';
import { loadSystemSettings } from '../../storage/systemSettings';


export default function ClientUploadPage() {
  const { token, client } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const systemSettings = loadSystemSettings();
  const maxFileSize = systemSettings.maxUploadMb * 1024 * 1024;
  const maxLocalRows = systemSettings.maxLocalRows;
  const [summary, setSummary] = useState<{ name: string; rows: number; columns: number; mapped: number } | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [showSheetPicker, setShowSheetPicker] = useState(false);

  const processFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setSummary(null);
    setWorkbook(null);
    setSelectedSheet('');
    setShowSheetPicker(false);
    if (file.size > maxFileSize) { setError(`Ukuran file melebihi batas ${systemSettings.maxUploadMb}MB.`); return; }
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) { setError('Gunakan file CSV, XLSX, atau XLS.'); return; }
    setProcessing(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      if (!wb.SheetNames.length) throw new Error('Workbook tidak memiliki sheet.');
      if (wb.SheetNames.length === 1) {
        await processSheet(wb, wb.SheetNames[0], file.name);
      } else {
        setWorkbook(wb);
        setSelectedSheet(wb.SheetNames[0]);
        setShowSheetPicker(true);
      }
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : 'File gagal diproses.');
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const processSheet = async (wb: XLSX.WorkBook, sheetName: string, fileName: string) => {
    try {
      const rawRows = XLSX.utils.sheet_to_json<DataRow>(wb.Sheets[sheetName], { defval: '' });
      if (!rawRows.length) throw new Error(`Sheet "${sheetName}" tidak memiliki baris data.`);
      const sourceRows = rawRows.slice(0, maxLocalRows);
      const mapped = mapRowsToCanonical(sourceRows);
      if (!mapped.headers.includes('sales_amount')) throw new Error('Kolom total penjualan tidak terdeteksi. Gunakan template atau nama kolom yang lebih jelas.');
      const workspace: ClientWorkspace = {
        id: globalThis.crypto?.randomUUID?.() || `workspace_${fileName.replace(/[^a-z0-9]+/gi, '_')}_${sourceRows.length}`,
        datasetName: fileName.replace(/\.[^.]+$/, ''),
        fileName,
        businessType: client?.business_type || 'General',
        headers: mapped.headers,
        rows: mapped.rows,
        savedAt: new Date().toISOString(),
      };
      try { saveWorkspace(workspace); } catch { throw new Error('Dataset terlalu besar untuk penyimpanan lokal browser. Kurangi jumlah baris lalu coba lagi.'); }
      if (token) {
        try {
          await clientApi.createDataset(token, { dataset_name: workspace.datasetName, file_name: fileName, row_count: mapped.rows.length, column_count: mapped.headers.length, business_type: workspace.businessType, workspace_local_id: workspace.id });
        } catch { /* Local workspace remains usable if metadata API is unavailable. */ }
      }
      setSummary({ name: fileName, rows: mapped.rows.length, columns: mapped.headers.length, mapped: mapped.mappedCount });
      setShowSheetPicker(false);
      setWorkbook(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memproses sheet.');
    }
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => processFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); processFile(event.dataTransfer.files?.[0]); };

  if (systemSettings.maintenanceMode || !systemSettings.allowClientUploads) {
    return <div className="space-y-6"><div><h1 className="text-xl font-bold text-gray-900">Upload Data</h1></div><div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-12 text-center"><AlertCircle className="mx-auto h-10 w-10 text-amber-600" /><h2 className="mt-3 font-bold text-amber-900">Upload sedang dinonaktifkan</h2><p className="mt-2 text-sm text-amber-800">Administrator sedang melakukan pemeliharaan atau membatasi upload baru.</p></div></div>;
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-gray-900">Upload Data</h1><p className="mt-0.5 text-sm text-gray-600">Data diproses dan disimpan di browser perangkat ini.</p></div>
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={onInput} className="sr-only" />
      <div onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => !processing && inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }} className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition ${dragging ? 'border-[#276749] bg-emerald-50' : 'border-gray-300 bg-white hover:border-[#276749]'}`}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#DCF4E7]"><UploadIcon className="h-8 w-8 text-[#276749]" /></div>
        <h2 className="text-lg font-semibold text-gray-900">{processing ? 'Memproses file...' : 'Pilih atau tarik file penjualan'}</h2>
        <p className="mt-2 text-sm text-gray-600">CSV, XLSX, atau XLS · maksimal {systemSettings.maxUploadMb}MB · hingga {maxLocalRows.toLocaleString('id-ID')} baris lokal</p>
      </div>
      {showSheetPicker && workbook && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-blue-700" />
            <h3 className="font-semibold text-blue-900">Pilih Sheet</h3>
            <span className="text-sm text-blue-600">({workbook.SheetNames.length} sheet ditemukan)</span>
          </div>
          <select
            value={selectedSheet}
            onChange={e => setSelectedSheet(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#276749]"
          >
            {workbook.SheetNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => processSheet(workbook, selectedSheet, inputRef.current?.files?.[0]?.name || 'dataset')}
              disabled={processing}
              className="px-4 py-2 bg-[#276749] text-white text-sm rounded-lg hover:bg-[#1f533a] disabled:opacity-50"
            >
              {processing ? 'Memproses...' : 'Proses Sheet Ini'}
            </button>
            <button
              onClick={() => { setShowSheetPicker(false); setWorkbook(null); }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Batal
            </button>
          </div>
        </div>
      )}
      {error && <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span></div>}
      {summary && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" /><div className="flex-1"><h2 className="font-semibold text-emerald-900">Dataset siap dianalisis</h2><p className="mt-1 text-sm text-emerald-800">{summary.name} · {summary.rows.toLocaleString('id-ID')} baris · {summary.columns} kolom</p><button onClick={() => navigate('/')} className="mt-4 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a]">Buka Dashboard</button></div></div></div>}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><FileSpreadsheet className="h-8 w-8 text-[#276749]" /><div><h2 className="font-semibold text-gray-900">Template Data DashInsight</h2><p className="text-sm text-gray-600">Gunakan struktur kolom yang sudah dikenali otomatis.</p></div></div><a href={TEMPLATE_WORKBOOK_URL} download className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#276749] px-4 py-2 text-sm font-semibold text-[#276749] hover:bg-emerald-50"><Download className="h-4 w-4" /> Download Template</a></div>
    </div>
  );
}
