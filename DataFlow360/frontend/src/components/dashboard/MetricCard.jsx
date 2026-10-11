export default function MetricCard({ label, value, change, icon: Icon }) {
    return <article className="rounded-xl border border-border bg-panel p-5"><div className="flex items-start justify-between"><p className="text-sm text-slate-400">{label}</p>
        {Icon && <Icon className="text-sky-300" size={20} />}</div>
        <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
        <p className="mt-2 text-xs text-emerald-300">{change}</p></article>;
}
