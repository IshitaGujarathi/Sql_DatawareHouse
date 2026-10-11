import { useEffect, useState } from 'react';
import { Database, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useDataset } from '../contexts/DatasetContext';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';

function Card({ label, value, icon: Icon, note }) {
  return <article className="rounded-xl border border-border bg-panel p-5"><Icon className="text-sky-300" size={20} />

    <p className="mt-4 text-sm text-slate-400">{label}</p>

    <p className="mt-1 text-3xl font-bold">{value}</p>

    <p className="mt-2 text-xs text-slate-500">{note}</p></article>;
}

export default function Dashboard() {
  const { selectedId, datasets } = useDataset(); const [state, setState] = useState({ loading: false, error: '', data: null });
  useEffect(() => { if (!selectedId) { setState({ loading: false, error: '', data: null }); return; } setState({ loading: true, error: '', data: null }); api.get('/dashboard', { params: { datasetId: selectedId } }).then(response => setState({ loading: false, error: '', data: response.data })).catch(error => setState({ loading: false, error: error.response?.data?.message || 'Unable to load selected dataset.', data: null })); }, [selectedId]);
  if (!selectedId) return <div className="p-6 lg:p-8"><div><p className="text-sm font-medium text-sky-300">Dataset workspace</p>

    <h2 className="text-2xl font-bold">Select a dataset</h2></div>

    <EmptyState title="Choose an uploaded CSV" detail={datasets.length ? 'Use the dataset selector in the top bar. Every view will then show only that selected dataset.' : 'Upload a CSV in CSV Data Lab and load it into the warehouse first.'} /></div>;
  if (state.loading || !state.data) return <div className="p-6"><LoadingState /></div>; if (state.error) return <div className="p-6"><ErrorState detail={state.error} /></div>; const d = state.data; const g = d.goldSummary;
  return <div className="space-y-6 p-6 lg:p-8"><div><p className="text-sm font-medium text-sky-300">Selected dataset</p>

    <h2 className="text-2xl font-bold">{d.dataset.file_name}</h2>

    <p className="mt-1 text-sm text-slate-400">This dashboard is isolated to this CSV. No sample or other uploaded data is included.</p></div>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card label="Bronze records" value={d.bronzeRecords} note="Raw uploaded rows" icon={Database} />

      <Card label="Silver records" value={d.silverRecords} note="Cleaned, unique rows" icon={Layers3} />

      <Card label="Gold quality score" value={`${d.dataQualityScore}%`} note="Dataset-level analytic score" icon={ShieldCheck} />

      <Card label="Duplicates removed" value={g?.duplicate_rows ?? 0} note="During CSV transformation" icon={Sparkles} /></section>

    {g && <section className="grid gap-4 md:grid-cols-3"><Card label="Total source rows" value={g.total_rows} note="Rows received from CSV" icon={Database} />

      <Card label="Clean rows" value={g.clean_rows} note="Available in Silver" icon={Layers3} />

      <Card label="Empty cells" value={g.null_cells} note="Detected in source data" icon={ShieldCheck} /></section>}

    <section className="rounded-xl border border-border bg-panel p-6"><h3 className="font-semibold">Dataset pipeline status</h3>

      <div className="mt-5 grid gap-3 md:grid-cols-4">{[['Bronze', d.bronzeRecords, 'Raw'], ['Silver', d.silverRecords, 'Cleaned'], ['Gold', d.goldRecords, 'Summary'], ['Reports', 1, 'Ready']].map(([name, value, status]) => <div key={name} className="rounded-lg border border-border bg-slate-950 p-4"><p className="text-sm font-medium">{name}</p>

        <p className="mt-2 text-2xl font-bold">{value}</p>

        <p className="mt-1 text-xs text-emerald-300">{status}</p></div>)}</div></section></div>;
}
