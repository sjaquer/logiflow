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
import { Button } from '../ui/button';

const menuItems = [
  { href: '/orders', label: 'Pedidos', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventario', icon: Box },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/users', label: 'Usuarios', icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();

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
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
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
         <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Ajustes', side: 'right' }}>
                    <Settings className="h-5 w-5" />
                    <span>Ajustes</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
