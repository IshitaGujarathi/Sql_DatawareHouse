const tones = { healthy: 'bg-emerald-400/10 text-emerald-300', processing: 'bg-amber-400/10 text-amber-300', warning: 'bg-rose-400/10 text-rose-300' };
export default function StatusBadge({ status = 'healthy' }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tones[status] || tones.healthy}`}>{status}</span>; }
