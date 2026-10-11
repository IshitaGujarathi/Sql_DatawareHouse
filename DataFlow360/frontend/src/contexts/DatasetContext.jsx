import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DatasetContext = createContext();
export function DatasetProvider({ children }) {
  const { user } = useAuth(); const [datasets, setDatasets] = useState([]); const [selectedId, setSelectedId] = useState(localStorage.getItem('dataflow360_dataset') || '');
  const refreshDatasets = () => { if (user?.role === 'VIEWER') return setDatasets([]); api.get('/csv/datasets').then(response => { setDatasets(response.data); const saved = localStorage.getItem('dataflow360_dataset'); if (!saved || !response.data.some(dataset => String(dataset.id) === String(saved))) { const latest = String(response.data[0]?.id || ''); setSelectedId(latest); if (latest) localStorage.setItem('dataflow360_dataset', latest); } }).catch(() => setDatasets([])); };
  useEffect(() => { if (user) refreshDatasets(); else { setDatasets([]); setSelectedId(''); } }, [user]);
  const selectDataset = id => { const value = String(id || ''); setSelectedId(value); if (value) localStorage.setItem('dataflow360_dataset', value); else localStorage.removeItem('dataflow360_dataset'); };
  return <DatasetContext.Provider value={{ datasets, selectedId, selectDataset, refreshDatasets }}>{children}</DatasetContext.Provider>;
}
export const useDataset = () => useContext(DatasetContext);
