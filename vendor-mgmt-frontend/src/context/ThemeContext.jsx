import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    document.body.classList.remove('light','dark');
    document.body.classList.add(theme);
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
