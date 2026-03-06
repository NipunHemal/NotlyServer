
"use client";

import React from 'react';
import { Group } from '@/store/use-store';
import { FileText, Layers, Clock, Users } from 'lucide-react';

interface GroupStatsProps {
  group: Group;
  subGroupCount: number;
}

export function GroupStats({ group, subGroupCount }: GroupStatsProps) {
  const stats = [
    { label: 'Total Notes', value: group.noteCount, icon: FileText, color: 'text-primary' },
    { label: 'Sub Groups', value: subGroupCount, icon: Layers, color: 'text-accent' },
    { label: 'Last Activity', value: group.lastModified, icon: Clock, color: 'text-ai' },
    { label: 'Collaborators', value: group.collaborators?.length || 5, icon: Users, color: 'text-orange-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card p-4 rounded-2xl flex items-center gap-4">
          <div className={`p-2.5 rounded-xl bg-white/[0.03] ${stat.color}`}>
            <stat.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{stat.label}</p>
            <p className="text-xl font-bold tracking-tight">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
