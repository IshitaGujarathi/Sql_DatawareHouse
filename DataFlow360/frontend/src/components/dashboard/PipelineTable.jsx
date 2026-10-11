import StatusBadge from '../ui/StatusBadge';
export default function PipelineTable({ jobs = [] }) {
    return <section className="overflow-hidden rounded-xl border border-border bg-panel"><div className="flex items-center justify-between p-5"><h2 className="font-semibold">Pipeline activity</h2>

        <span className="text-sm text-sky-300">Live jobs</span></div>

        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-border text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Job</th>

            <th>Records</th>

            <th>Status</th>

            <th className="px-5">Updated</th></tr></thead>

            <tbody>{jobs.slice(0, 5).map(job => <tr key={job.id} className="border-b border-border/70 last:border-0"><td className="px-5 py-4 font-medium">ETL #{job.id}</td>

                <td className="text-slate-400">{job.records_processed}</td>

                <td><StatusBadge status={job.status === 'SUCCESS' ? 'healthy' : job.status === 'RUNNING' ? 'processing' : 'warning'} /></td>

                <td className="px-5 text-slate-400">{new Date(job.started_at).toLocaleString()}</td></tr>)}</tbody></table></div></section>;
}
