
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingCart, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ManagedQueueTableProps {
  leads: Client[];
}

export function ManagedQueueTable({ leads }: ManagedQueueTableProps) {
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  
  const getConfirmationTime = (lead: Client) => {
    return format(new Date(lead.last_updated), 'HH:mm:ss', { locale: es });
  }

  if (leads.length === 0) {
      return (
          <div className="text-center text-muted-foreground p-8">
              Aún no se han gestionado leads hoy.
          </div>
      )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {leads.map((lead) => (
            <Card key={lead.id}>
                <CardHeader>
                    <CardTitle className="text-base">{lead.nombres}</CardTitle>
                    <CardDescription>{getConfirmationTime(lead)}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                     <div className="flex items-center gap-2">
                         {lead.tienda_origen ? (
                              <div className="flex items-center gap-2">
                                  <ShoppingCart className="h-4 w-4 text-primary" />
                                  <span className="font-medium capitalize">{lead.tienda_origen}</span>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                <span className="capitalize">{lead.source}</span>
                              </div>
                          )}
                    </div>
                     {lead.assigned_agent_name && (
                         <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage src={lead.assigned_agent_avatar} />
                                      <AvatarFallback>{getInitials(lead.assigned_agent_name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{lead.assigned_agent_name}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{lead.assigned_agent_name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                      )}
                </CardContent>
            </Card>
        ))}
    </div>
  );
}

    