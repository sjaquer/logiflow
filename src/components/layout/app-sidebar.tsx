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
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Box,
  BarChart3,
  Warehouse,
  Settings,
  LogOut,
  Code,
  Users,
  Phone,
  PackagePlus,
  UsersCog
} from 'lucide-react';
import type { User, UserRole } from '@/lib/types';
import { SettingsPanel } from '@/components/layout/settings-panel';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useDevMode } from '@/context/dev-mode-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AppSidebarProps {
  currentUser: User | null;
}

const menuItems: { href: string; label: string; icon: React.ElementType; requiredRoles?: UserRole[] }[] = [
  { href: '/orders', label: 'Pedidos', icon: LayoutDashboard },
  { href: '/call-center-queue', label: 'Call Center', icon: Phone, requiredRoles: ['Call Center', 'Admin', 'Desarrolladores'] },
  { href: '/create-order', label: 'Procesar Pedido', icon: PackagePlus, requiredRoles: ['Call Center', 'Admin', 'Desarrolladores'] },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/inventory', label: 'Inventario', icon: Box },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/staff', label: 'Roles y Personal', icon: UsersCog, requiredRoles: ['Admin', 'Desarrolladores'] },
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

  const filterItems = (items: typeof menuItems) => {
      return items.filter(item => {
        if (!item.requiredRoles) return true; // No roles required, show to everyone
        if (!currentUser) return false; // If no user, don't show role-restricted items
        return item.requiredRoles.includes(currentUser.rol);
      });
  }

  return (
    <Sidebar
      collapsible="icon"
      className="hidden md:flex border-r border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0 h-screen"
    >
      <SidebarHeader className="h-16 flex items-center justify-center px-4">
        <Link href="/orders" className="flex items-center gap-2 font-bold text-primary group-data-[collapsible=icon]:justify-center">
           <div className="flex items-center justify-center overflow-hidden group-data-[collapsible=icon]:data-[state=collapsed]:hidden">
              <Image src="/logo.png" alt="LogiFlow Logo" width={100} height={25} style={{ height: '25px', width: 'auto' }} />
           </div>
          <Warehouse className="h-6 w-6 shrink-0 hidden group-data-[collapsible=icon]:data-[state=collapsed]:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {filterItems(menuItems).map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                size="lg"
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:data-[state=collapsed]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 space-y-2">
        {currentUser?.rol === 'Desarrolladores' && (
           <div className="p-2 group-data-[collapsible=icon]:data-[state=collapsed]:hidden">
              <div className="flex items-center justify-between p-2 rounded-lg border border-sidebar-border/50">
                  <Label htmlFor="dev-mode" className="flex items-center gap-2 text-sm text-sidebar-foreground/80">
                      <Code className="h-4 w-4" />
                      Modo Dev
                  </Label>
                  <Switch
                      id="dev-mode"
                      checked={isDevMode}
                      onCheckedChange={setIsDevMode}
                  />
              </div>
           </div>
        )}
         <SettingsPanel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" tooltip={{ children: 'Apariencia', side: 'right' }}>
                        <Settings className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:data-[state=collapsed]:hidden">Apariencia</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
         </SettingsPanel>
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={{ children: 'Cerrar Sesión', side: 'right' }} onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:data-[state=collapsed]:hidden">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
