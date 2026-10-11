import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext();
export function ThemeProvider({ children }) { const [dark, setDark] = useState(true); useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]); return <ThemeContext.Provider value={{ dark, toggleTheme: () => setDark(v => !v) }}>{children}</ThemeContext.Provider>; }
export const useTheme = () => useContext(ThemeContext);
