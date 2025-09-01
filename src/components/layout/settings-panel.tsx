'use client';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/context/theme-provider';

interface SettingsPanelProps {
  children: React.ReactNode;
}

const colorThemes = [
  { name: 'Azul', value: 'blue', hsl: '197 76% 53%' },
  { name: 'Naranja', value: 'orange', hsl: '25 95% 53%' },
  { name: 'Verde', value: 'green', hsl: '142 71% 45%' },
  { name: 'Violeta', value: 'violet', hsl: '262 84% 58%' },
  { name: 'Rosa', value: 'rose', hsl: '347 77% 50%' },
];

export function SettingsPanel({ children }: SettingsPanelProps) {
  const { theme, setTheme, color, setColor } = useTheme();

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Ajustes de Interfaz</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-8">
          <div className="space-y-4">
            <Label className="font-medium">Modo de Color</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label="Toggle dark mode"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="font-medium">Color de Acento</Label>
            <div className="grid grid-cols-5 gap-2">
              {colorThemes.map((c) => (
                <Button
                  key={c.value}
                  variant={color === c.value ? 'default' : 'outline'}
                  className="h-12 w-full"
                  style={{'--theme-primary': c.hsl} as React.CSSProperties}
                  onClick={() => setColor(c.value)}
                >
                   <span className="h-6 w-6 rounded-full" style={{backgroundColor: `hsl(${c.hsl})`}}></span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
