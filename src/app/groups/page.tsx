
"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useStore } from '@/store/use-store';
import { GroupCard } from '@/components/groups/group-card';
import { GroupTreeSidebar } from '@/components/groups/group-tree-sidebar';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GroupsOverviewPage() {
  const { groups } = useStore();
  const rootGroups = groups.filter(g => !g.parentId);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-130px)] -m-8">
        <GroupTreeSidebar />
        
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Knowledge Base</h1>
                <p className="text-muted-foreground max-w-lg">
                  Organize your ideas and documents into hierarchical structures. Create sub-groups to build a deep knowledge tree.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search groups..." className="bg-white/[0.03] border-white/10 pl-10 h-11 rounded-xl" />
                </div>
                <Button size="icon" variant="outline" className="h-11 w-11 rounded-xl border-white/10">
                  <Filter className="w-5 h-5" />
                </Button>
                <Button className="h-11 px-6 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5" /> New Group
                </Button>
              </div>
            </header>

            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold tracking-tight">Main Groups</h2>
                <span className="text-xs text-muted-foreground font-mono">{rootGroups.length} ROOT CATEGORIES</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rootGroups.map(group => (
                  <GroupCard key={group.id} group={group} />
                ))}
                
                <button className="rounded-2xl border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-8 gap-4 text-muted-foreground hover:text-primary min-h-[220px]">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary/20">
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-sm">Create New Group</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
