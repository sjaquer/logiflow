'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export interface ColorTheme {
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
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
}

export interface Palette {
    name: string;
    displayName: string;
    light: ColorTheme;
    dark: ColorTheme;
}


const palettes: Palette[] = [
  {
    name: 'default',
    displayName: 'LogiFlow Original',
    light: {
        background: '208 100% 97%',
        foreground: '222.2 84% 4.9%',
        card: '0 0% 100%',
        cardForeground: '222.2 84% 4.9%',
        popover: '0 0% 100%',
        popoverForeground: '222.2 84% 4.9%',
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
    dark: {
        background: '222.2 47.4% 11.2%',
        foreground: '210 40% 98%',
        card: '222.2 47.4% 11.2%',
        cardForeground: '210 40% 98%',
        popover: '222.2 47.4% 11.2%',
        popoverForeground: '210 40% 98%',
        primary: '197 76% 53%',
        primaryForeground: '210 40% 98%',
        secondary: '217.2 32.6% 17.5%',
        secondaryForeground: '210 40% 98%',
        muted: '217.2 32.6% 17.5%',
        mutedForeground: '215 20.2% 65.1%',
        accent: '39 100% 50%',
        accentForeground: '39 90% 10%',
        destructive: '0 62.8% 30.6%',
        destructiveForeground: '210 40% 98%',
        border: '217.2 32.6% 17.5%',
        input: '217.2 32.6% 17.5%',
        ring: '197 76% 45%',
    }
  },
  {
    name: 'forest',
    displayName: 'Bosque Profundo',
    light: {
      background: '120 15% 97%',
      foreground: '120 25% 10%',
      card: '0 0% 100%',
      cardForeground: '120 25% 10%',
      popover: '0 0% 100%',
      popoverForeground: '120 25% 10%',
      primary: '140 65% 35%',
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
      ring: '140 65% 35%',
    },
    dark: {
      background: '120 10% 8%',
      foreground: '120 5% 95%',
      card: '120 10% 12%',
      cardForeground: '120 5% 95%',
      popover: '120 10% 8%',
      popoverForeground: '120 5% 95%',
      primary: '140 60% 45%',
      primaryForeground: '140 20% 97%',
      secondary: '130 10% 15%',
      secondaryForeground: '130 5% 90%',
      muted: '130 10% 15%',
      mutedForeground: '120 5% 65%',
      accent: '100 50% 55%',
      accentForeground: '100 20% 97%',
      destructive: '0 60% 50%',
      destructiveForeground: '0 0% 100%',
      border: '120 10% 20%',
      input: '120 10% 20%',
      ring: '140 60% 45%',
    }
  },
  {
    name: 'sunset',
    displayName: 'Atardecer Naranja',
    light: {
      background: '30 100% 98%',
      foreground: '25 50% 15%',
      card: '0 0% 100%',
      cardForeground: '25 50% 15%',
      popover: '0 0% 100%',
      popoverForeground: '25 50% 15%',
      primary: '25 95% 53%',
      primaryForeground: '30 50% 98%',
      secondary: '35 60% 95%',
      secondaryForeground: '25 30% 20%',
      muted: '35 60% 95%',
      mutedForeground: '30 15% 45%',
      accent: '347 77% 60%',
      accentForeground: '347 30% 15%',
      destructive: '0 80% 60%',
      destructiveForeground: '0 0% 100%',
      border: '30 50% 90%',
      input: '30 50% 90%',
      ring: '25 95% 53%',
    },
    dark: {
      background: '20 20% 10%',
      foreground: '30 10% 95%',
      card: '20 20% 14%',
      cardForeground: '30 10% 95%',
      popover: '20 20% 10%',
      popoverForeground: '30 10% 95%',
      primary: '25 85% 55%',
      primaryForeground: '30 30% 98%',
      secondary: '20 15% 18%',
      secondaryForeground: '20 5% 90%',
      muted: '20 15% 18%',
      mutedForeground: '30 10% 65%',
      accent: '347 70% 60%',
      accentForeground: '347 20% 97%',
      destructive: '0 70% 55%',
      destructiveForeground: '0 0% 100%',
      border: '20 15% 22%',
      input: '20 15% 22%',
      ring: '25 85% 55%',
    }
  },
    {
    name: 'royal',
    displayName: 'Violeta Real',
    light: {
      background: '260 100% 98%',
      foreground: '265 40% 15%',
      card: '0 0% 100%',
      cardForeground: '265 40% 15%',
      popover: '0 0% 100%',
      popoverForeground: '265 40% 15%',
      primary: '262 84% 58%',
      primaryForeground: '260 50% 98%',
      secondary: '265 60% 96%',
      secondaryForeground: '265 30% 20%',
      muted: '265 60% 96%',
      mutedForeground: '260 15% 45%',
      accent: '320 80% 60%',
      accentForeground: '320 30% 15%',
      destructive: '0 80% 60%',
      destructiveForeground: '0 0% 100%',
      border: '260 50% 92%',
      input: '260 50% 92%',
      ring: '262 84% 58%',
    },
    dark: {
      background: '265 20% 9%',
      foreground: '260 10% 96%',
      card: '265 20% 12%',
      cardForeground: '260 10% 96%',
      popover: '265 20% 9%',
      popoverForeground: '260 10% 96%',
      primary: '262 74% 68%',
      primaryForeground: '260 30% 98%',
      secondary: '265 15% 16%',
      secondaryForeground: '265 5% 92%',
      muted: '265 15% 16%',
      mutedForeground: '260 10% 65%',
      accent: '320 70% 65%',
      accentForeground: '320 20% 98%',
      destructive: '0 70% 60%',
      destructiveForeground: '0 0% 100%',
      border: '265 15% 20%',
      input: '265 15% 20%',
      ring: '262 74% 68%',
    }
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
  colorPalette: Palette;
  setColorPalette: (paletteName: string) => void;
  palettes: Palette[];
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
  const [theme, setTheme] = useState<Theme>(() => {
      if (typeof window === 'undefined') {
        return defaultTheme;
      }
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  });
  
  const [colorPalette, _setColorPalette] = useState<Palette>(() => {
    if (typeof window === 'undefined') {
      return palettes.find(p => p.name === defaultPalette) || palettes[0];
    }
    const storedPaletteName = localStorage.getItem(paletteStorageKey);
    return palettes.find(p => p.name === storedPaletteName) || palettes.find(p => p.name === defaultPalette) || palettes[0];
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const currentColors = theme === 'dark' ? colorPalette.dark : colorPalette.light;

    for (const [name, value] of Object.entries(currentColors)) {
      const cssVarName = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      root.style.setProperty(`--${cssVarName}`, value);
    }
    
    root.style.setProperty('--sidebar-primary', currentColors.primary);
    root.style.setProperty('--chart-1', currentColors.primary);
    root.style.setProperty('--chart-2', currentColors.accent);
    
    localStorage.setItem(storageKey, theme);
    localStorage.setItem(paletteStorageKey, colorPalette.name);

  }, [theme, colorPalette, storageKey, paletteStorageKey]);


  const setColorPalette = (paletteName: string) => {
    const newPalette = palettes.find(p => p.name === paletteName);
    if (newPalette) {
      _setColorPalette(newPalette);
    }
  };

  const value = {
    theme,
    setTheme,
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
