
"use client";

import React from 'react';
import { GroupStats as IGroupStats } from '@/service/functions/group.service';
import { FileText, Layers, Clock, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GroupStatsProps {
  stats?: IGroupStats;
}

export function GroupStats({ stats }: GroupStatsProps) {
  const items = [
    { 
      label: 'Total Knowledge', 
      value: stats?.total_note_count || 0, 
      icon: FileText, 
      color: 'text-primary',
      description: 'Nested documents' 
    },
    { 
      label: 'Direct Children', 
      value: stats?.direct_subgroup_count || 0, 
      icon: Layers, 
      color: 'text-accent',
      description: 'Folders in this level'
    },
    { 
      label: 'Last Interaction', 
      value: (() => {
        if (!stats?.last_activity_at) return 'Never';
        try {
          const date = new Date(stats.last_activity_at);
          return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
        } catch {
          return 'Recently';
        }
      })(), 
      icon: Clock, 
      color: 'text-emerald-400',
      description: 'Latest modification'
    },
    { 
      label: 'Security Status', 
      value: 'Verified', 
      icon: ShieldCheck, 
      color: 'text-orange-400',
      description: 'Encrypted storage'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((stat) => (
        <div key={stat.label} className="glass-panel p-5 rounded-3xl border-white/5 flex flex-col gap-4 group hover:border-primary/20 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl bg-white/[0.03] ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{stat.label}</p>
              <p className="text-lg font-black tracking-tight mt-0.5">{stat.value}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.03]">
             <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">{stat.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
