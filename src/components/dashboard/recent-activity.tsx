
"use client";

import React from 'react';
import { useStore } from '@/store/use-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Share2, History, Trash2, Key } from 'lucide-react';

const icons = {
  edit: Edit2,
  share: Share2,
  version: History,
  restore: History,
  access: Key,
};

export function RecentActivity() {
  const { activities } = useStore();

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => {
        const Icon = icons[activity.type] || Edit2;
        return (
          <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 group">
            <div className="relative">
              <Avatar className="w-10 h-10 border border-white/10">
                <AvatarImage src={`https://picsum.photos/seed/user-${idx}/100/100`} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-card border border-white/10 text-primary">
                <Icon className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight text-foreground/90">
                <span className="font-bold text-foreground">{activity.user}</span> {activity.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
