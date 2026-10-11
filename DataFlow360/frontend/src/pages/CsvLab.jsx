import { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { EmptyState } from '../components/ui/StateViews';

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]; const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && next === '\n') index += 1; row.push(cell); if (row.some(value => value.trim())) rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  row.push(cell); if (row.some(value => value.trim())) rows.push(row);
  if (quoted) throw new Error('The CSV has an unmatched quotation mark.');
  if (rows.length < 2) throw new Error('CSV needs a header row and at least one data row.');
  const headers = rows[0].map((value, index) => value.trim() || `Column ${index + 1}`);
  const unique = new Set(); const safeHeaders = headers.map(header => { let name = header; let number = 2; while (unique.has(name.toLowerCase())) { name = `${header} ${number}`; number += 1; } unique.add(name.toLowerCase()); return name; });
  return { headers: safeHeaders, rows: rows.slice(1).map(row => safeHeaders.map((_, index) => (row[index] || '').trim())) };
}

export default function CsvLab() {
  const [result, setResult] = useState(null); const [payload, setPayload] = useState(null); const [busy, setBusy] = useState(false); const [importing, setImporting] = useState(false); const [fileName, setFileName] = useState(''); const input = useRef(); const { notify } = useToast();
  const choose = async (event) => { const file = event.target.files?.[0]; if (!file) return; if (!file.name.toLowerCase().endsWith('.csv')) return notify('Choose a .csv file.', 'error'); if (file.size > 8 * 1024 * 1024) return notify('Choose a CSV smaller than 8 MB.', 'error'); setBusy(true); setResult(null); setPayload(null); setFileName(file.name); try { const parsed = parseCsv(await file.text()); if (parsed.rows.length > 10000) throw new Error('CSV is limited to 10,000 rows for interactive analysis.'); const response = await api.post('/csv/analyze', { fileName: file.name, ...parsed }); setPayload(parsed); setResult(response.data); notify('CSV analysis completed.'); } catch (error) { setFileName(''); notify(error.response?.data?.message || error.message || 'Unable to analyze this CSV.', 'error'); } finally { setBusy(false); event.target.value = ''; } };
  const importDataset = async () => { if (!payload || !result) return; setImporting(true); try { const response = await api.post('/csv/import', { fileName, ...payload, qualityScore: result.summary.overallScore }); notify(`${response.data.rowCount} rows loaded into Bronze, Silver, and Gold.`); } catch (error) { notify(error.response?.data?.message || 'Unable to import this CSV.', 'error'); } finally { setImporting(false); } };
  const clear = () => { setResult(null); setPayload(null); setFileName(''); };
  return <div className="space-y-6 p-6 lg:p-8"><div><p className="text-sm font-medium text-sky-300">File workspace</p>
    <h2 className="text-2xl font-bold">CSV Data Lab</h2>
    <p className="mt-1 text-sm text-slate-400">Inspect CSVs safely, then optionally save them to isolated dataset storage.</p></div>
    <section className="rounded-xl border border-dashed border-sky-400/40 bg-panel p-8 text-center"><FileSpreadsheet className="mx-auto mb-4 text-sky-300" size={34} />
      <h3 className="font-semibold">Upload a CSV file</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Supports quoted commas, duplicate checks, null checks, and email/phone validation. Maximum 10,000 rows and 8 MB.</p>
      <input ref={input} onChange={choose} type="file" accept=".csv,text/csv" className="hidden" />
      <button disabled={busy} onClick={() => input.current?.click()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-50"><Upload size={17} />
        {busy ? 'Analyzing CSV…' : 'Choose CSV file'}</button></section>
    {result ? <CsvResults result={result} fileName={fileName} clear={clear} importing={importing} onImport={importDataset} /> : <EmptyState title="No CSV loaded" detail="Upload a CSV to preview it and evaluate data quality." />}</div>;
}

function CsvResults({ result, fileName, clear, importing, onImport }) {
  const summary = result.summary; return <><section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-panel p-5"><div><p className="font-semibold">{fileName}</p>
    <p className="mt-1 text-sm text-slate-400">{result.rowCount.toLocaleString()} rows ·
      {result.columnCount} columns</p></div>
    <div className="flex gap-2"><button disabled={importing} onClick={onImport} className="rounded-lg bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{importing ? 'Loading…' : 'Load into warehouse'}</button>
      <button onClick={clear} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><X size={16} />Clear</button></div></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Overall quality" value={`${summary.overallScore}%`} />
      <Stat label="Empty cells" value={summary.nullCells} />
      <Stat label="Duplicate rows" value={summary.duplicateRows} />
      <Stat label="Invalid values" value={summary.invalidValues} /></section>
    <section className="grid gap-4 md:grid-cols-3"><Score label="Completeness" value={summary.completeness} />
      <Score label="Validity" value={summary.validity} />
      <Score label="Uniqueness" value={summary.uniqueness} /></section>
    <section className="overflow-hidden rounded-xl border border-border bg-panel"><div className="p-5"><h3 className="font-semibold">Data preview</h3>
      <p className="mt-1 text-sm text-slate-400">Loading creates raw Bronze records, deduplicated Silver records, and a Gold dataset-quality summary.</p></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-border text-xs uppercase text-slate-500"><tr>{result.headers.map(header => <th key={header} className="whitespace-nowrap px-4 py-3">{header}</th>)}</tr></thead>
        <tbody>{result.preview.map((row, index) => <tr key={index} className="border-b border-border/60 last:border-0">{result.headers.map(header => <td key={header} className="max-w-64 truncate px-4 py-3 text-slate-300">{row[header] || '—'}</td>)}</tr>)}</tbody></table></div></section>
    {result.columns.length > 0 && <section className="overflow-hidden rounded-xl border border-border bg-panel"><h3 className="p-5 font-semibold">Column issues</h3>
      <table className="w-full text-left text-sm"><thead className="border-y border-border text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Column</th>
        <th>Empty</th>
        <th>Duplicates</th>
        <th className="px-5">Invalid</th></tr></thead>
        <tbody>{result.columns.map(column => <tr key={column.name} className="border-b border-border/60"><td className="px-5 py-3 font-medium">{column.name}</td>
          <td>{column.nulls}</td>
          <td>{column.duplicates}</td>
          <td className="px-5 text-rose-300">{column.invalid}</td></tr>)}</tbody></table></section>}</>
}
function Stat({ label, value }) {
  return <article className="rounded-xl border border-border bg-panel p-5"><p className="text-sm text-slate-400">{label}</p>
    <p className="mt-3 text-2xl font-bold">{value}</p></article>;
}
function Score({ label, value }) {
  return <article className="rounded-xl border border-border bg-panel p-5"><div className="flex justify-between text-sm"><span>{label}</span>
    <span className="text-sky-300">{value}%</span></div>
    <div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-400" style={{ width: `${value}%` }} /></div></article>;
}
