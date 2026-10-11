import { Bell, Moon, Sun, LogOut } from 'lucide-react'; import { useTheme } from '../../contexts/ThemeContext'; import { useAuth } from '../../contexts/AuthContext'; import { useDataset } from '../../contexts/DatasetContext';
export default function Topbar() {
    const { dark, toggleTheme } = useTheme(); const { user, signOut } = useAuth(); const { datasets, selectedId, selectDataset } = useDataset(); return <header className="flex h-20 items-center justify-between border-b border-border px-6 lg:px-8"><div className="ml-11 lg:ml-0"><p className="text-sm text-slate-400">Data platform</p>
        <h1 className="font-semibold">Dataset analytics</h1></div>
        <div className="flex items-center gap-3">{user?.role !== 'VIEWER' && <select value={selectedId} onChange={e => selectDataset(e.target.value)} className="hidden max-w-48 rounded-lg border border-border bg-slate-950 px-3 py-2 text-xs text-slate-300 md:block"><option value="">Select CSV dataset</option>
            {datasets.map(dataset => <option key={dataset.id} value={dataset.id}>{dataset.file_name}</option>)}</select>}
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800" onClick={toggleTheme}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><Bell size={19} /></button>
            <div title={user?.name} className="grid h-9 w-9 place-items-center rounded-full bg-sky-400/15 text-sm font-bold text-sky-300">{user?.name?.slice(0, 2).toUpperCase() || 'DF'}</div>
            <button onClick={signOut} title="Sign out" className="text-slate-400 hover:text-slate-100"><LogOut size={18} /></button></div></header>;
}
