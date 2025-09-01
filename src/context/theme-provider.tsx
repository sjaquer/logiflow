'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export interface ColorPalette {
  name: string;
  displayName: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

const palettes: ColorPalette[] = [
  {
    name: 'default',
    displayName: 'LogiFlow Original',
    colors: {
        background: '208 100% 97%',
        foreground: '222.2 84% 4.9%',
        primary: '197 76% 53%',
        primaryForeground: '210 40% 98%',
        secondary: '210 40% 96.1%',
        secondaryForeground: '222.2 47.4% 11.2%',
        muted: '210 40% 96.1%',
        mutedForeground: '215.4 16.3% 46.9%',
        accent: '39 100% 50%',
        accentForeground: '24 9.8% 10%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '0 0% 98%',
        border: '214.3 31.8% 91.4%',
        input: '214.3 31.8% 91.4%',
        ring: '197 76% 53%',
    },
  },
  {
    name: 'forest',
    displayName: 'Bosque Profundo',
    colors: {
      background: '120 15% 96%',
      foreground: '120 25% 10%',
      primary: '140 65% 40%',
      primaryForeground: '140 25% 98%',
      secondary: '130 10% 94%',
      secondaryForeground: '130 15% 20%',
      muted: '130 10% 94%',
      mutedForeground: '120 5% 45%',
      accent: '100 50% 55%',
      accentForeground: '100 25% 15%',
      destructive: '0 70% 50%',
      destructiveForeground: '0 0% 100%',
      border: '120 10% 88%',
      input: '120 10% 88%',
      ring: '140 65% 40%',
    },
  },
  {
    name: 'sunset',
    displayName: 'Atardecer Naranja',
    colors: {
      background: '30 100% 97%',
      foreground: '25 50% 15%',
      primary: '25 95% 53%',
      primaryForeground: '30 50% 98%',
      secondary: '35 60% 95%',
      secondaryForeground: '25 30% 20%',
      muted: '35 60% 95%',
      mutedForeground: '30 15% 45%',
      accent: '347 77% 50%',
      accentForeground: '347 30% 15%',
      destructive: '0 80% 60%',
      destructiveForeground: '0 0% 100%',
      border: '30 50% 90%',
      input: '30 50% 90%',
      ring: '25 95% 53%',
    },
  },
    {
    name: 'royal',
    displayName: 'Violeta Real',
    colors: {
      background: '260 100% 97%',
      foreground: '265 40% 15%',
      primary: '262 84% 58%',
      primaryForeground: '260 50% 98%',
      secondary: '265 60% 95%',
      secondaryForeground: '265 30% 20%',
      muted: '265 60% 95%',
      mutedForeground: '260 15% 45%',
      accent: '320 80% 60%',
      accentForeground: '320 30% 15%',
      destructive: '0 80% 60%',
      destructiveForeground: '0 0% 100%',
      border: '260 50% 90%',
      input: '260 50% 90%',
      ring: '262 84% 58%',
    },
  },
];


type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultPalette?: string;
  storageKey?: string;
  paletteStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorPalette: ColorPalette;
  setColorPalette: (paletteName: string) => void;
  palettes: ColorPalette[];
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  colorPalette: palettes[0],
  setColorPalette: () => null,
  palettes: palettes,
};


const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  defaultPalette = 'default',
  storageKey = 'vite-ui-theme',
  paletteStorageKey = 'vite-ui-color-palette',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [colorPalette, _setColorPalette] = useState<ColorPalette>(
    () => {
      const storedPaletteName = localStorage.getItem(paletteStorageKey);
      return palettes.find(p => p.name === storedPaletteName) || palettes.find(p => p.name === defaultPalette) || palettes[0];
    }
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const colors = colorPalette.colors;

    Object.entries(colors).forEach(([name, value]) => {
      // Convert camelCase to kebab-case
      const cssVarName = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      root.style.setProperty(`--${cssVarName}`, value);
    });
    
    // Specific overrides for charts and sidebar if needed
    root.style.setProperty('--sidebar-primary', colors.primary);
    root.style.setProperty('--chart-1', colors.primary);
    root.style.setProperty('--chart-2', colors.accent);

  }, [colorPalette]);


  const setColorPalette = (paletteName: string) => {
    const newPalette = palettes.find(p => p.name === paletteName);
    if (newPalette) {
      localStorage.setItem(paletteStorageKey, paletteName);
      _setColorPalette(newPalette);
    }
  };

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    colorPalette,
    setColorPalette,
    palettes,
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
