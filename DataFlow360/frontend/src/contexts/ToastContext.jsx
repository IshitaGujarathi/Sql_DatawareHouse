import { createContext, useContext, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
const ToastContext = createContext();
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]); const notify = (message, type = 'success') => { const id = Date.now(); setToasts(t => [...t, { id, message, type }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500); }; return <ToastContext.Provider value={{ notify }}>{children}
        <div className="fixed right-5 top-5 z-50 space-y-3">{toasts.map(t => <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3 shadow-2xl"><CheckCircle2 className={t.type === 'error' ? 'text-rose-400' : 'text-emerald-400'} size={18} />
            <span>{t.message}</span>
            <button onClick={() => setToasts(x => x.filter(i => i.id !== t.id))}><X size={16} /></button></div>)}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
