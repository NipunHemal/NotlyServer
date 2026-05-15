
"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useStore } from '@/store/use-store';
import { GroupCard } from '@/components/groups/group-card';
import { GroupTreeSidebar } from '@/components/groups/group-tree-sidebar';
import { Plus, Search, Filter, Loader2, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGroupTree } from '@/service/query/useGroup';

export default function GroupsOverviewPage() {
  const { user, setCreateGroupModalOpen } = useStore();
  const { data: groupTree, isLoading } = useGroupTree(user?.id);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-130px)] -m-8">
        <GroupTreeSidebar />
        
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Library className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-black tracking-tight">Intelligence Library</h1>
                <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
                  The central nervous system of your knowledge. Organize documents into a secure, hierarchical structure of intelligent groups.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input placeholder="Filter repositories..." className="bg-white/[0.03] border-white/10 pl-12 h-12 rounded-xl focus:ring-primary/20 transition-all" />
                </div>
                <Button 
                  onClick={() => setCreateGroupModalOpen(true)}
                  className="h-12 px-8 rounded-xl gap-2 font-black bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105"
                >
                  <Plus className="w-5 h-5" /> New Group
                </Button>
              </div>
            </header>

            <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold tracking-tight">Root Categories</h2>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full border border-primary/20 uppercase tracking-widest">
                    Top Level
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{groupTree?.length || 0} Repositories</span>
              </div>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Hierarchy...</p>
                </div>
              ) : groupTree && groupTree.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupTree.map(group => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                  
                  <button 
                    onClick={() => setCreateGroupModalOpen(true)}
                    className="rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-8 gap-5 text-muted-foreground hover:text-primary min-h-[260px] group"
                  >
                    <div className="p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 group-hover:border-primary/20 group-hover:scale-110 transition-all">
                      <Plus className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="font-black text-sm uppercase tracking-widest block">Initiate Group</span>
                      <span className="text-[10px] opacity-50 block font-bold">START A NEW KNOWLEDGE BRANCH</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 space-y-6 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                   <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/10">
                     <Library className="w-10 h-10 text-muted-foreground/20" />
                   </div>
                   <div className="text-center space-y-2">
                     <h3 className="text-2xl font-black tracking-tight">Your library is empty</h3>
                     <p className="text-muted-foreground text-sm max-w-xs mx-auto">Build your second brain by creating your first knowledge group.</p>
                   </div>
                   <Button 
                    onClick={() => setCreateGroupModalOpen(true)}
                    className="h-12 px-10 rounded-xl gap-2 font-black shadow-2xl shadow-primary/30"
                   >
                     <Plus className="w-5 h-5" /> Create Group
                   </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
