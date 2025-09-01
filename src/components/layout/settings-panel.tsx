'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/context/theme-provider';
import type { Palette } from '@/context/theme-provider';

interface SettingsPanelProps {
  children: React.ReactNode;
}

export function SettingsPanel({ children }: SettingsPanelProps) {
  const { theme, setTheme, colorPalette, setColorPalette, palettes } = useTheme();
  
  const getDisplayColors = (palette: Palette) => {
    const p = theme === 'dark' ? palette.dark : palette.light;
    return [p.primary, p.accent, p.background];
  }

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
            <Label className="font-medium">Paleta de Colores</Label>
            <div className="grid grid-cols-1 gap-3">
              {palettes.map((palette: Palette) => (
                <Button
                  key={palette.name}
                  variant={colorPalette.name === palette.name ? 'default' : 'outline'}
                  onClick={() => setColorPalette(palette.name)}
                  className="h-auto w-full justify-start text-left p-3"
                >
                   <div className="flex items-center gap-4">
                     <div className="flex -space-x-2">
                        {getDisplayColors(palette).map((color, index) => (
                           <div key={index} className="h-6 w-6 rounded-full border-2 border-card" style={{backgroundColor: `hsl(${color})`}}></div>
                        ))}
                     </div>
                     <span>{palette.displayName}</span>
                   </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
