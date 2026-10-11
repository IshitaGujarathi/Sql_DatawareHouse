import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';import { AuthProvider } from './contexts/AuthContext';import { DatasetProvider } from './contexts/DatasetContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './index.css';
createRoot(document.getElementById('root')).render(<StrictMode><ErrorBoundary><BrowserRouter><ThemeProvider><ToastProvider><AuthProvider><DatasetProvider><App /></DatasetProvider></AuthProvider></ToastProvider></ThemeProvider></BrowserRouter></ErrorBoundary></StrictMode>);
