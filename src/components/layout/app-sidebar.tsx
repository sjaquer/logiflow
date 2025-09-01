'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
  Users,
  Warehouse,
  Settings,
} from 'lucide-react';
import type { User } from '@/lib/types';
import { SettingsPanel } from '@/components/layout/settings-panel';

interface AppSidebarProps {
  currentUser: User | null;
}

const menuItems = [
  { href: '/orders', label: 'Pedidos', icon: LayoutDashboard, requiredRole: null },
  { href: '/inventory', label: 'Inventario', icon: Box, requiredRole: null },
  { href: '/reports', label: 'Reportes', icon: BarChart3, requiredRole: null },
  { href: '/users', label: 'Usuarios', icon: Users, requiredRole: 'ADMIN' },
];

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const pathname = usePathname();

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiredRole) return true;
    return currentUser?.rol === item.requiredRole;
  });

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border"
      variant="sidebar"
    >
      <SidebarHeader className="h-16 flex items-center justify-center">
        <Link href="/orders" className="flex items-center gap-2 font-bold text-primary">
          <Warehouse className="h-6 w-6" />
          <span className="text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            LogiFlow
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {filteredMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                size="lg"
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
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
                        <span>Ajustes</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
         </SettingsPanel>
      </SidebarFooter>
    </Sidebar>
  );
}
