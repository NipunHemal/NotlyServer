
"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useStore, Activity } from '@/store/use-store';
import { 
  Activity as ActivityIcon, Edit2, Share2, History, 
  Trash2, Key, Plus, Upload, Filter, Search, MoreHorizontal,
  Clock, Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const icons = {
  edit: Edit2,
  share: Share2,
  version: History,
  restore: History,
  access: Key,
  create: Plus,
  upload: Upload,
  delete: Trash2,
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'create': return 'text-primary';
    case 'upload': return 'text-ai';
    case 'delete': return 'text-destructive';
    case 'version': return 'text-accent';
    default: return 'text-muted-foreground';
  }
};

export default function ActivitiesPage() {
  const { activities } = useStore();

  const groupedActivities = activities.reduce((acc, curr) => {
    const group = curr.dateGroup || 'Older';
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em]">
              <ActivityIcon className="w-3.5 h-3.5" /> Audit Log
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">System Activity</h1>
            <p className="text-muted-foreground">Comprehensive tracking of all knowledge base operations.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Filter logs..." className="bg-white/[0.03] border-white/10 pl-10 h-11 rounded-xl w-64" />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/10">
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="space-y-12 pb-20">
          {Object.entries(groupedActivities).map(([group, logs]) => (
            <section key={group} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 whitespace-nowrap">
                  {group}
                </h2>
                <div className="h-px w-full bg-white/5" />
              </div>

              <div className="space-y-1">
                {logs.map((activity, idx) => {
                  const Icon = icons[activity.type] || Edit2;
                  return (
                    <div key={activity.id} className="group flex items-center gap-6 p-4 rounded-2xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5">
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <span className="text-[10px] font-mono text-muted-foreground/40 font-bold uppercase">{activity.timestamp}</span>
                      </div>
                      
                      <div className="relative">
                        <Avatar className="w-10 h-10 border border-white/10">
                          <AvatarImage src={`https://picsum.photos/seed/user-${idx}/100/100`} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-card border border-white/10 ${getIconColor(activity.type)}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-relaxed text-foreground/90">
                          <span className="font-bold text-white group-hover:text-primary transition-colors">{activity.user}</span> 
                          {' '}{activity.description}
                        </p>
                      </div>

                      <div className="hidden md:flex items-center gap-4">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-white transition-colors">
                          {activity.type}
                        </Badge>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
