import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, message: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, message: error?.message || 'Unknown application error' }; }
  componentDidCatch(error) { console.error('DataFlow360 UI error:', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="grid min-h-screen place-items-center bg-surface p-6"><section className="max-w-lg rounded-2xl border border-rose-400/30 bg-panel p-8 text-center shadow-2xl"><AlertTriangle className="mx-auto mb-4 text-rose-300" size={34} />
<h1 className="text-xl font-bold">Unable to load DataFlow360</h1>
<p className="mt-2 text-sm text-slate-400">The application encountered an error while opening this page.</p>
<code className="mt-5 block overflow-auto rounded-lg bg-slate-950 p-3 text-left text-xs text-rose-300">{this.state.message}</code>
<button onClick={() => window.location.reload()} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 font-semibold text-slate-950"><RefreshCw size={16} />Refresh application</button></section></main>;
  }
}
