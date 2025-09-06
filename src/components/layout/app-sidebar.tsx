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
  PlusCircle,
} from 'lucide-react';
import type { User, UserRole } from '@/lib/types';
import { SettingsPanel } from '@/components/layout/settings-panel';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

interface AppSidebarProps {
  currentUser: User | null;
}

const menuItems: { href: string; label: string; icon: React.ElementType; requiredRoles?: UserRole[] }[] = [
  { href: '/orders', label: 'Pedidos', icon: LayoutDashboard },
  { href: '/create-order', label: 'Crear Pedido', icon: PlusCircle, requiredRoles: ['Call Center', 'Admin', 'Desarrolladores'] },
  { href: '/inventory', label: 'Inventario', icon: Box },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
];

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiredRoles) return true; // No roles required, show to everyone
    if (!currentUser) return false; // If no user, don't show role-restricted items
    return item.requiredRoles.includes(currentUser.rol);
  });

  return (
    <Sidebar
      collapsible="icon"
      className="hidden md:flex border-r border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0 h-screen"
    >
      <SidebarHeader className="h-16 flex items-center justify-center px-4">
        <Link href="/orders" className="flex items-center gap-2 font-bold text-primary group-data-[collapsible=icon]:justify-center">
           <div className="group-data-[collapsible=icon]:data-[state=collapsed]:hidden">
              <Image src="/logo.png" alt="LogiFlow Logo" width={120} height={30} className="h-auto" />
           </div>
          <Warehouse className="h-6 w-6 shrink-0 hidden group-data-[collapsible=icon]:data-[state=collapsed]:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {filteredMenuItems.map((item) => (
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
      <SidebarFooter className="p-2">
         <SettingsPanel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" tooltip={{ children: 'Ajustes', side: 'right' }}>
                        <Settings className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:data-[state=collapsed]:hidden">Ajustes</span>
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
