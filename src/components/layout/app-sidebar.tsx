
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Box,
  LogOut,
  Phone,
  PackagePlus,
  Settings,
  Code,
  Package,
} from 'lucide-react';
import type { User } from '@/lib/types';
import { SettingsPanel } from '@/components/layout/settings-panel';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useDevMode } from '@/context/dev-mode-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AppSidebarProps {
  currentUser: User | null;
}

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  permissionKey: keyof NonNullable<User['permisos']['puede_ver']>;
}

const menuItems: MenuItem[] = [
  { href: '/call-center-queue', label: 'Call Center', icon: Phone, permissionKey: 'call_center' },
  { href: '/create-order', label: 'Procesar Pedido', icon: PackagePlus, permissionKey: 'procesar_pedido' },
  { href: '/orders', label: 'Órdenes', icon: Package, permissionKey: 'procesar_pedido' },
  { href: '/inventory', label: 'Inventario', icon: Box, permissionKey: 'inventario' },
];

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const { isDevMode, setIsDevMode } = useDevMode();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show all items in the sidebar (remove role/permission based filtering)
  const filterItems = (items: typeof menuItems) => {
    return items;
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="border-b border-sidebar-border p-5">
        <Link href="/" className="flex items-center gap-2 font-semibold group-data-[collapsible=icon]:justify-center">
           <div className="flex items-center justify-center overflow-hidden group-data-[collapsible=icon]:data-[state=collapsed]:hidden">
              <Image 
                src="/logo.png" 
                alt="LogiFlow Logo" 
                width={120} 
                height={30} 
                style={{ height: '30px', width: 'auto' }}
                priority
              />
           </div>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm hidden group-data-[collapsible=icon]:data-[state=collapsed]:flex">
            LF
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 px-3 py-4">
        <SidebarMenu className="space-y-1">
          {filterItems(menuItems).map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                size="lg"
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: 'right' }}
                className="rounded-lg px-3 py-2.5 transition-all data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="group-data-[collapsible=icon]:data-[state=collapsed]:hidden font-medium">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        {currentUser?.rol === 'Desarrolladores' && (
           <>
             <div className="p-3 group-data-[collapsible=icon]:data-[state=collapsed]:hidden rounded-lg bg-sidebar-accent/50">
                <div className="flex items-center justify-between">
                    <Label htmlFor="dev-mode" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <Code className="h-4 w-4" />
                        <span>Modo Dev</span>
                    </Label>
                    <Switch
                        id="dev-mode"
                        checked={isDevMode}
                        onCheckedChange={setIsDevMode}
                    />
                </div>
             </div>
             <SidebarSeparator className="my-1" />
           </>
        )}

         <SettingsPanel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton 
                      size="lg" 
                      tooltip={{ children: 'Configuración', side: 'right' }}
                      className="rounded-lg px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:data-[state=collapsed]:hidden font-medium">Configuración</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
         </SettingsPanel>

         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              tooltip={{ children: 'Cerrar Sesión', side: 'right' }} 
              onClick={handleLogout}
              className="rounded-lg px-3 py-2.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
                <LogOut className="h-5 w-5 shrink-0" />
                <span className="group-data-[collapsible=icon]:data-[state=collapsed]:hidden font-medium">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

