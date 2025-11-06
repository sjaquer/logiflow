/**
 * Contexto de Notificaciones para Call Center
 * Maneja notificaciones de nuevos leads y cambios de estado
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'new_lead' | 'status_change' | 'assignment';
  title: string;
  message: string;
  leadId: string;
  leadName: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastLeadCount, setLastLeadCount] = useState<number>(0);
  const { toast } = useToast();

  // Escuchar nuevos leads de Shopify
  useEffect(() => {
    // Obtener timestamp de hace 5 minutos para evitar notificaciones de leads antiguos al cargar
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const q = query(
      collection(db, 'shopify_leads'),
      where('call_status', '==', 'NUEVO'),
      orderBy('created_time', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentCount = snapshot.size;

      // Si es la primera carga, solo guardar el conteo
      if (lastLeadCount === 0) {
        setLastLeadCount(currentCount);
        return;
      }

      // Si hay más leads que antes, crear notificaciones
      if (currentCount > lastLeadCount) {
        const newLeads = snapshot.docs
          .slice(0, currentCount - lastLeadCount)
          .map(doc => ({ id: doc.id, ...doc.data() } as Client))
          .filter(lead => {
            const createdTime = lead.created_time ? new Date(lead.created_time) : new Date();
            return createdTime > fiveMinutesAgo;
          });

        newLeads.forEach(lead => {
          const notification: Notification = {
            id: `${lead.id}-${Date.now()}`,
            type: 'new_lead',
            title: '🔔 Nuevo Lead',
            message: `${lead.nombres || 'Cliente'} - ${lead.tienda_origen || lead.store_name || 'Tienda'}`,
            leadId: lead.id,
            leadName: lead.nombres || 'Sin nombre',
            timestamp: new Date(),
            read: false,
            data: lead
          };

          setNotifications(prev => [notification, ...prev].slice(0, 50)); // Mantener máximo 50

          // Mostrar toast para el primer lead nuevo
          if (newLeads.indexOf(lead) === 0) {
            toast({
              title: '🔔 Nuevo Lead Recibido',
              description: `${lead.nombres || 'Cliente'} desde ${lead.tienda_origen || lead.store_name}`,
              duration: 5000,
            });
          }
        });
      }

      setLastLeadCount(currentCount);
    });

    return () => unsubscribe();
  }, [lastLeadCount, toast]);

  // Escuchar cambios de estado en leads asignados al usuario actual
  useEffect(() => {
    // Este efecto se puede expandir para escuchar cambios de estado
    // Por ahora, solo escucha nuevos leads
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
