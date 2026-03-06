
"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useStore } from '@/store/use-store';
import { DocCard } from '@/components/documents/doc-card';
import { Filter, Grid, List as ListIcon, SortDesc, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DocsPage() {
  const { notes } = useStore();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Your Documents</h1>
            <p className="text-muted-foreground">Manage and organize all your personal and shared knowledge.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search within docs..." 
                className="bg-white/[0.03] border-white/10 pl-10 h-11 rounded-xl"
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/10">
              <Filter className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/10">
              <SortDesc className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <Tabs defaultValue="all" className="w-auto">
            <TabsList className="bg-transparent border-none p-0 gap-8 h-auto">
              <TabsTrigger value="all" className="bg-transparent border-none shadow-none px-0 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold">All Docs</TabsTrigger>
              <TabsTrigger value="shared" className="bg-transparent border-none shadow-none px-0 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold">Shared</TabsTrigger>
              <TabsTrigger value="archived" className="bg-transparent border-none shadow-none px-0 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold">Archived</TabsTrigger>
            </TabsList>
          </Tabs>

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

        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'flex flex-col gap-4'}>
          {filteredNotes.map((note) => (
            view === 'grid' ? (
              <DocCard key={note.id} note={note} />
            ) : (
              <div key={note.id} className="glass-card p-4 rounded-xl flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold group-hover:text-primary transition-colors">{note.title}</h4>
                    <p className="text-xs text-muted-foreground">{note.category} • {note.lastEdited}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex gap-1">
                    {note.tags.map(t => <Badge key={t} variant="outline" className="text-[9px] uppercase">{t}</Badge>)}
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

import { FileText, MoreVertical } from 'lucide-react';
