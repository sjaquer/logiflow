'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

interface DroppableProps {
  id: OrderStatus;
  onDrop: (orderId: string, newStatus: OrderStatus) => void;
  children: React.ReactNode;
}

export function Droppable({ id, onDrop, children }: DroppableProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      onDrop(orderId, id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn('h-full transition-colors rounded-lg', isOver && 'bg-primary/10')}
    >
      {children}
    </div>
  );
}
