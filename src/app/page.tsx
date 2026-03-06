"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { DocCard } from '@/components/documents/doc-card';
import { useStore } from '@/store/use-store';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { ChevronRight, Plus, Sparkles, Layers, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { notes, groups, setCreateNoteModalOpen } = useStore();
  const router = useRouter();
  
  // Sort notes by last activity (mocking it with current list)
  const recentNotes = notes.slice(0, 4);
  const activeGroups = groups.slice(0, 3);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-12">
        {/* Welcome Section */}
        <section className="relative overflow-hidden p-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-background to-background border border-white/5">
          <div className="absolute top-0 right-0 p-8 text-primary/10">
            <Sparkles className="w-64 h-64 rotate-12" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              Pro Account Active
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-none text-white">
              Welcome back, Alex.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Your intelligent workspace is ready. You have <span className="text-white font-semibold">12 new insights</span> since yesterday. What's the plan today?
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button 
                size="lg" 
                onClick={() => setCreateNoteModalOpen(true)}
                className="rounded-full h-14 px-10 gap-2 bg-white text-black hover:bg-white/90 font-bold text-lg shadow-2xl shadow-white/10"
              >
                <Plus className="w-6 h-6" /> Start New Doc
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => router.push('/groups')}
                className="rounded-full h-14 px-10 gap-2 border-white/10 hover:bg-white/5 font-bold text-lg text-white"
              >
                <Layers className="w-6 h-6" /> Browse Groups
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-white">System Overview</h2>
              <p className="text-muted-foreground">Snapshot of your digital knowledge base.</p>
            </div>
            <Button variant="ghost" onClick={() => router.push('/activities')} className="text-muted-foreground hover:text-white transition-colors">
              Full Analytics <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
          <StatsGrid />
        </section>

        {/* Grid for Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main List Column */}
          <div className="lg:col-span-2 space-y-16">
            {/* Recent Groups */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Active Groups</h2>
                </div>
                <Link href="/groups">
                  <Button variant="link" className="text-primary hover:text-primary/80 font-bold p-0">Manage Hierarchy</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {activeGroups.map((group, idx) => (
                  <motion.div 
                    key={group.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => router.push(`/groups/${group.id}`)}
                    className="glass-card p-6 rounded-[1.75rem] flex flex-col gap-6 group cursor-pointer border border-white/5 hover:border-primary/20"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/10 group-hover:bg-primary/10 transition-colors">
                      <Layers className={`w-6 h-6 ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-accent' : 'text-ai'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{group.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{group.noteCount} notes • {group.lastModified}</p>
                    </div>
                  </motion.div>
                ))}
                <button 
                  onClick={() => router.push('/groups')}
                  className="rounded-[1.75rem] border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-6 gap-3 text-muted-foreground hover:text-primary group"
                >
                  <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">View All</span>
                </button>
              </div>
            </section>

            {/* Recent Docs */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Recently Edited</h2>
                </div>
                <Link href="/docs">
                  <Button variant="link" className="text-primary hover:text-primary/80 font-bold p-0">Browse Archive</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recentNotes.map((note) => (
                  <DocCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          </div>

          {/* Activity Column */}
          <aside className="space-y-8">
            <div className="glass-panel p-8 rounded-[2.5rem] sticky top-24 border border-white/5 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Recent Activity
                </h2>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              <RecentActivity />
              <Button 
                variant="outline" 
                onClick={() => router.push('/activities')}
                className="w-full mt-8 rounded-xl border-white/10 hover:bg-white/5 text-white h-11 font-bold"
              >
                Full Activity Log
              </Button>
            </div>

            <div className="glass-card p-8 rounded-[2rem] bg-gradient-to-br from-ai/10 to-transparent border-ai/20 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-ai/10 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-ai">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">AI Intelligence Tip</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                  I noticed you're writing a lot about <span className="text-white font-bold">Project Phoenix</span>. Would you like me to generate a summary report of the latest changes?
                </p>
                <div className="flex gap-3">
                  <Button size="sm" className="bg-ai text-ai-foreground hover:bg-ai/90 rounded-xl font-bold px-4 h-9">
                    Generate
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-white rounded-xl h-9">
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
