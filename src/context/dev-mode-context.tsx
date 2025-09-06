'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  setIsDevMode: (isDevMode: boolean) => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export function DevModeProvider({ children }: { children: ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(false);

  return (
    <DevModeContext.Provider value={{ isDevMode, setIsDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
}
