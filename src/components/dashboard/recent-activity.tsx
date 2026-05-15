
"use client";

import React from 'react';
import { DashboardRecentItem } from '@/service/functions/dashboard.service';
import { FileText, Activity as ActivityIcon, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

interface RecentActivityProps {
  items?: DashboardRecentItem[];
  isLoading: boolean;
}

const getIcon = (iconStr: string) => {
  switch (iconStr) {
    case 'note': return FileText;
    case 'activity': return ActivityIcon;
    default: return FileText;
  }
};

export function RecentActivity({ items, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const Icon = getIcon(item.icon);
        const isNote = item.type === 'NOTE';
        const href = isNote ? `/notes/${item.id}` : `/activities`;
        
        return (
          <Link key={item.id} href={href} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 group">
            <div className="relative shrink-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${isNote ? 'bg-primary/10 text-primary' : 'bg-ai/10 text-ai'}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center h-10">
              <p className="text-sm font-bold leading-tight text-foreground/90 truncate">
                {item.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground/50" />
                <p className="text-xs font-medium text-muted-foreground/70">{item.subtitle}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
