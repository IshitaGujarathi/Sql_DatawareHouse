import { AlertCircle, DatabaseZap, LoaderCircle } from 'lucide-react';
export function LoadingState() { return <div className="flex min-h-48 items-center justify-center gap-3 text-slate-400"><LoaderCircle className="animate-spin" /> Loading data…</div>; }
export function EmptyState({ title = 'No data available', detail = 'New data will appear here when it is ready.' }) {
    return <div className="grid min-h-48 place-items-center text-center text-slate-400"><div><DatabaseZap className="mx-auto mb-3 text-slate-500" />
        <p className="font-medium text-slate-200">{title}</p>
        <p className="mt-1 text-sm">{detail}</p></div></div>;
}
export function ErrorState({ detail = 'We could not load this data.' }) {
    return <div className="flex min-h-48 items-center justify-center gap-3 text-rose-300"><AlertCircle />
        {detail}</div>;
}
