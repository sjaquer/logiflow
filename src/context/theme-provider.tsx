'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
type ColorTheme = 'blue' | 'green' | 'orange' | 'rose' | 'violet';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColor?: ColorTheme;
  storageKey?: string;
  colorStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  color: ColorTheme;
  setColor: (color: ColorTheme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  color: 'blue',
  setColor: () => null,
};

const colorMap: Record<ColorTheme, string> = {
  blue: '197 76% 53%',
  green: '142 71% 45%',
  orange: '25 95% 53%',
  rose: '347 77% 50%',
  violet: '262 84% 58%',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  defaultColor = 'blue',
  storageKey = 'vite-ui-theme',
  colorStorageKey = 'vite-ui-color-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [color, setColor] = useState<ColorTheme>(
    () => (localStorage.getItem(colorStorageKey) as ColorTheme) || defaultColor
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--primary', colorMap[color]);
    root.style.setProperty('--sidebar-primary', colorMap[color]);
    root.style.setProperty('--ring', colorMap[color]);
    root.style.setProperty('--chart-1', colorMap[color]);

  }, [color]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    color,
    setColor: (color: ColorTheme) => {
      localStorage.setItem(colorStorageKey, color);
      setColor(color);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
