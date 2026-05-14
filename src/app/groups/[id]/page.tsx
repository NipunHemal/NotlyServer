
"use client";

import React, { use } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useStore } from '@/store/use-store';
import { GroupTreeSidebar } from '@/components/groups/group-tree-sidebar';
import { GroupHeader } from '@/components/groups/group-header';
import { GroupStats } from '@/components/groups/group-stats';
import { GroupCard } from '@/components/groups/group-card';
import { DocCard } from '@/components/documents/doc-card';
import { BreadcrumbNavigation } from '@/components/groups/breadcrumb-navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, Grid, List as ListIcon, Filter, Plus, Lock, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { groups, notes } = useStore();
  const group = groups.find(g => g.id === id);
  const subGroups = groups.filter(g => g.parentId === id);
  const groupNotes = notes.filter(n => n.groupId === id && !n.isDeleted);
  
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [isLocked, setIsLocked] = React.useState(group?.isLocked || false);
  const [unlocked, setUnlocked] = React.useState(!group?.isLocked);

  if (!group) return <div>Group not found</div>;

  if (isLocked && !unlocked) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-160px)]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-[2.5rem] max-w-md w-full text-center space-y-8 border-primary/20"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Lock className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">{group.name} is Locked</h2>
              <p className="text-muted-foreground text-sm">This group is protected with a secondary password. Please enter the key to access its contents.</p>
            </div>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type="password" placeholder="Group Password" className="h-12 pl-12 rounded-xl bg-white/[0.03] border-white/10" />
            </div>
            <Button onClick={() => setUnlocked(true)} className="w-full h-12 rounded-xl text-md font-bold shadow-xl shadow-primary/20">
              Unlock Group
            </Button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-130px)] -m-8">
        <GroupTreeSidebar />
        
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-10">
            <BreadcrumbNavigation currentGroupId={group.id} />
            
            <GroupHeader group={group} />
            
            <GroupStats group={group} subGroupCount={subGroups.length} />

            <Tabs defaultValue="contents" className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5">
                <TabsList className="bg-transparent border-none p-0 gap-8 h-auto">
                  <TabsTrigger value="contents" className="bg-transparent border-none shadow-none px-0 py-4 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold text-md">Overview</TabsTrigger>
                  <TabsTrigger value="subgroups" className="bg-transparent border-none shadow-none px-0 py-4 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold text-md">Sub Groups ({subGroups.length})</TabsTrigger>
                  <TabsTrigger value="notes" className="bg-transparent border-none shadow-none px-0 py-4 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold text-md">Notes ({groupNotes.length})</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center bg-white/[0.03] p-1 rounded-xl border border-white/5">
                    <Button 
                      variant={view === 'grid' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="h-8 px-3 rounded-lg"
                      onClick={() => setView('grid')}
                    >
                      <Grid className="w-4 h-4 mr-2" /> Grid
                    </Button>
                    <Button 
                      variant={view === 'list' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="h-8 px-3 rounded-lg"
                      onClick={() => setView('list')}
                    >
                      <ListIcon className="w-4 h-4 mr-2" /> List
                    </Button>
                  </div>
                </div>
              </div>

              <TabsContent value="contents" className="space-y-12 m-0 outline-none">
                {subGroups.length > 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Sub Groups</h3>
                      <Button variant="ghost" className="text-primary hover:text-primary/80 text-xs font-bold">See all</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {subGroups.map(sub => (
                        <GroupCard key={sub.id} group={sub} />
                      ))}
                    </div>
                  </section>
                )}

                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Notes in {group.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input placeholder="Search in group..." className="h-9 w-48 pl-9 bg-white/[0.03] border-white/5 rounded-lg text-xs" />
                      </div>
                      <Button size="icon" variant="outline" className="h-9 w-9 border-white/5 rounded-lg">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {groupNotes.length > 0 ? (
                    <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                      {groupNotes.map(note => (
                        <DocCard key={note.id} note={note} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-4">
                      <div className="p-4 rounded-2xl bg-white/[0.02]">
                        <Plus className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold">No notes here yet</p>
                        <p className="text-sm text-muted-foreground">Start adding content to this group.</p>
                      </div>
                      <Button className="rounded-xl px-6 gap-2">
                        <Plus className="w-4 h-4" /> Create First Note
                      </Button>
                    </div>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="subgroups" className="m-0 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {subGroups.map(sub => (
                    <GroupCard key={sub.id} group={sub} />
                  ))}
                  <button className="rounded-2xl border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-8 gap-4 text-muted-foreground hover:text-primary min-h-[200px]">
                    <Plus className="w-6 h-6" />
                    <span className="font-bold text-sm">New Sub Group</span>
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="m-0 outline-none">
                <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                  {groupNotes.map(note => (
                    <DocCard key={note.id} note={note} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
