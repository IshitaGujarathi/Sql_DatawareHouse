import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import { useDataset } from '../contexts/DatasetContext';
import DataGrid from '../components/data/DataGrid';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';

export default function Gold() {
  const { selectedId } = useDataset(); const [overview, setOverview] = useState(null); const [error, setError] = useState('');
  useEffect(() => { if (!selectedId) { setOverview(null); return; } setError(''); api.get(`/csv/datasets/${selectedId}/overview`).then(response => setOverview(response.data)).catch(err => setError(err.response?.data?.message || 'Unable to load selected dataset analytics.')); }, [selectedId]);
  if (!selectedId) return <div className="p-6 lg:p-8"><EmptyState title="Select a CSV dataset" detail="Use the dataset selector in the top bar to view its isolated Gold analytics."/></div>;
  if (error) return <div className="p-6"><ErrorState detail={error}/></div>; if (!overview) return <div className="p-6"><LoadingState/></div>; const g=overview.gold;
  return <div className="space-y-6 p-6 lg:p-8"><div><p className="text-sm font-medium text-yellow-300">Gold layer · selected CSV</p><h2 className="text-2xl font-bold">{overview.dataset.file_name}</h2><p className="mt-1 text-sm text-slate-400">Gold metrics are calculated only from this selected file.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={FileSpreadsheet} label="Source rows" value={g?.total_rows ?? overview.dataset.row_count}/><Metric icon={CheckCircle2} label="Clean rows" value={g?.clean_rows ?? overview.silverRecords}/><Metric icon={BarChart3} label="Quality score" value={`${g?.quality_score ?? overview.dataset.quality_score}%`}/><Metric icon={BarChart3} label="Duplicates removed" value={g?.duplicate_rows ?? 0}/></section><section className="rounded-xl border border-border bg-panel"><div className="p-5"><h3 className="font-semibold">Gold dataset summary</h3><p className="mt-1 text-sm text-slate-400">The final analytical output for this CSV only.</p></div><DataGrid resourceKey={`gold-summary-${selectedId}`} fetcher={({page,search})=>api.get('/gold/gold_csv_dataset_summary',{params:{page,search,datasetId:selectedId}}).then(r=>r.data)}/></section></div>;
}
function Metric({icon:Icon,label,value}) { return <article className="rounded-xl border border-border bg-panel p-5"><Icon className="text-yellow-300" size={20}/><p className="mt-4 text-sm text-slate-400">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></article>; }
