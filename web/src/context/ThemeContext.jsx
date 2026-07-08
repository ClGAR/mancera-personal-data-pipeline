import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'personal-data-pipeline-theme';
const ThemeContext = createContext(null);
const validPreferences = new Set(['light', 'dark', 'system']);

function getStoredPreference() {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return validPreferences.has(stored) ? stored : 'system';
}

function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = themePreference === 'system' ? systemTheme : themePreference;

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;

    function handleChange(event) {
      setSystemTheme(event.matches ? 'dark' : 'light');
    }

    query.addEventListener('change', handleChange);
    setSystemTheme(query.matches ? 'dark' : 'light');
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  function setThemePreference(nextPreference) {
    if (!validPreferences.has(nextPreference)) return;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    setThemePreferenceState(nextPreference);
  }

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference
    }),
    [themePreference, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
