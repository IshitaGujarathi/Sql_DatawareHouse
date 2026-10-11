import { useEffect, useState } from 'react';
import { ArrowDown, Database, FileSpreadsheet, Layers3, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { ErrorState, LoadingState } from '../components/ui/StateViews';

const stages = [
  { title: 'Sources', detail: 'CSV uploads and connected sources', icon: FileSpreadsheet, tone: 'text-sky-300' },
  { title: 'Bronze', detail: 'Raw source records', icon: Database, tone: 'text-amber-300', key: 'bronzeRecords' },
  { title: 'Silver', detail: 'Validated, standardized records', icon: Layers3, tone: 'text-slate-200', key: 'silverRecords' },
  { title: 'Gold', detail: 'Business-ready aggregates', icon: Database, tone: 'text-yellow-300', key: 'goldRecords' },
  { title: 'Analytics', detail: 'Dashboards and reports', icon: BarChart3, tone: 'text-emerald-300' },
];

export default function Lineage() {
  const [state, setState] = useState({ loading: true, error: '', dashboard: null, datasets: [] });
  useEffect(() => { Promise.all([api.get('/dashboard'), api.get('/csv/datasets')]).then(([dashboard, datasets]) => setState({ loading: false, error: '', dashboard: dashboard.data, datasets: datasets.data })).catch(error => setState({ loading: false, error: error.response?.data?.message || 'Unable to load lineage.', dashboard: null, datasets: [] })); }, []);
  if (state.loading) return <div className="p-6"><LoadingState/></div>; if (state.error) return <div className="p-6"><ErrorState detail={state.error}/></div>;
  return <div className="space-y-6 p-6 lg:p-8"><div><p className="text-sm font-medium text-sky-300">Observability</p><h2 className="text-2xl font-bold">Data Lineage</h2><p className="mt-1 text-sm text-slate-400">Trace how datasets move from source through warehouse layers into analytics.</p></div><section className="grid items-stretch gap-3 xl:grid-cols-9">{stages.map((stage, index) => { const Icon = stage.icon; return <div key={stage.title} className="contents"><article className="rounded-xl border border-border bg-panel p-5 xl:col-span-1"><Icon className={stage.tone} size={22}/><h3 className="mt-4 font-semibold">{stage.title}</h3><p className="mt-2 text-sm text-slate-400">{stage.key ? `${state.dashboard[stage.key]} records` : stage.detail}</p></article>{index < stages.length - 1 && <div className="grid place-items-center xl:col-span-1"><ArrowDown className="rotate-[-90deg] text-slate-500 xl:rotate-[-90deg]" size={20}/></div>}</div>; })}</section><section className="rounded-xl border border-border bg-panel"><div className="p-5"><h3 className="font-semibold">Imported CSV datasets</h3><p className="mt-1 text-sm text-slate-400">Stored separately from warehouse tables until you choose a future mapping/import action.</p></div>{state.datasets.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-border text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Dataset</th><th>Rows</th><th>Quality</th><th className="px-5">Imported</th></tr></thead><tbody>{state.datasets.map(dataset => <tr key={dataset.id} className="border-b border-border/60"><td className="px-5 py-3 font-medium">{dataset.file_name}</td><td>{dataset.row_count}</td><td className="text-emerald-300">{dataset.quality_score}%</td><td className="px-5 text-slate-400">{new Date(dataset.created_at).toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-slate-400">No CSV datasets have been saved yet.</p>}</section></div>;
}
