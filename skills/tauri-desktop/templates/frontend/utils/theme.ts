export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'app-theme';

function resolveTheme(mode: ThemeMode): 'appLight' | 'appDark' {
  if (mode === 'light') return 'appLight';
  if (mode === 'dark') return 'appDark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'appDark' : 'appLight';
}

export function getSavedTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = resolveTheme(mode);
  localStorage.setItem(THEME_KEY, mode);
}
