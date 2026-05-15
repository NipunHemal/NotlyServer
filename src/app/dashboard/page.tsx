
"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { DocCard } from '@/components/documents/doc-card';
import { useStore } from '@/store/use-store';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { ChevronRight, Plus, Sparkles, Search, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const { notes, groups } = useStore();
  const recentNotes = notes.filter(n => !n.isDeleted).slice(0, 3);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Welcome Section */}
        <section className="relative overflow-hidden p-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-background to-background border border-white/5">
          <div className="absolute top-0 right-0 p-8 text-primary/10">
            <Sparkles className="w-64 h-64 rotate-12" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <h1 className="text-5xl font-bold tracking-tighter">Welcome back, Alex.</h1>
            <p className="text-xl text-muted-foreground/80 leading-relaxed">
              Your intelligent workspace is ready. You have <span className="text-foreground font-semibold">12 new insights</span> since yesterday. What's the plan today?
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/new">
                <Button size="lg" className="rounded-full px-8 gap-2 bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-2xl">
                  <Plus className="w-5 h-5" /> Start New Doc
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 border-white/10 hover:bg-white/5 font-semibold">
                <Layers className="w-5 h-5" /> Browse Groups
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              View full analytics <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
          <StatsGrid />
        </section>

        {/* Grid for Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main List Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Recent Groups */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">Active Groups</h2>
                <Button variant="link" className="text-primary p-0">See all</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {groups.map((group, idx) => (
                  <motion.div 
                    key={group.id}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card p-5 rounded-2xl flex flex-col gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/10">
                      <Layers className={`w-6 h-6 ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-accent' : 'text-ai'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold">{group.name}</h4>
                      <p className="text-xs text-muted-foreground">{group.noteCount} notes • {group.lastModified}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Recent Docs */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">Recently Edited</h2>
                <Button variant="link" className="text-primary p-0">View all</Button>
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
            <div className="glass-panel p-8 rounded-[2rem] sticky top-24">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                Recent Activity
              </h2>
              <RecentActivity />
              <Button variant="outline" className="w-full mt-8 rounded-xl border-white/10 hover:bg-white/5">
                Full Activity Log
              </Button>
            </div>

            <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-ai/10 to-transparent border-ai/20">
              <div className="flex items-center gap-2 mb-3 text-ai">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">AI Tip</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                I noticed you're writing a lot about <span className="text-foreground font-semibold">AI Latency</span>. Should I organize these into a new dedicated group?
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="bg-ai text-ai-foreground hover:bg-ai/90 rounded-lg font-bold">Yes, please</Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">Ignore</Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
