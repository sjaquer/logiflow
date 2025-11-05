'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/context/theme-provider';
import type { Palette } from '@/context/theme-provider';
import { Switch } from '@/components/ui/switch';
import { Palette as PaletteIcon } from 'lucide-react';

interface SettingsPanelProps {
  children: React.ReactNode;
}

export function SettingsPanel({ children }: SettingsPanelProps) {
  const { colorPalette, setColorPalette, palettes } = useTheme();
  
  const getDisplayColors = (palette: Palette) => {
    const p = palette.light;
    return [p.primary, p.accent, p.background];
  }

  const { theme, setTheme } = useTheme();

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <PaletteIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Ajustes de Interfaz</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Personaliza la apariencia</p>
            </div>
          </div>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-4">
            <Label className="font-semibold text-base">Paleta de Colores</Label>
            <div className="grid grid-cols-1 gap-3">
              {palettes.map((palette: Palette) => (
                <Button
                  key={palette.name}
                  variant={colorPalette.name === palette.name ? 'default' : 'outline'}
                  onClick={() => setColorPalette(palette.name)}
                  className="h-auto w-full justify-start text-left p-4 hover:shadow-md transition-all"
                >
                   <div className="flex items-center gap-4">
                     <div className="flex -space-x-2">
                        {getDisplayColors(palette).map((color, index) => (
                           <div 
                             key={index} 
                             className="h-8 w-8 rounded-full border-2 border-white shadow-sm" 
                             style={{backgroundColor: `hsl(${color})`}}
                           />
                        ))}
                     </div>
                     <span className="font-medium">{palette.displayName}</span>
                   </div>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Modo Oscuro</Label>
                <p className="text-sm text-muted-foreground">Activa o desactiva el modo oscuro</p>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={handleThemeToggle} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
