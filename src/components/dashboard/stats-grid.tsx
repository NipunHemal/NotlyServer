
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Share2, Star, Clock } from 'lucide-react';
import { DashboardStats } from '@/service/functions/dashboard.service';
import { Loader2 } from 'lucide-react';

interface StatsGridProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  const statItems = [
    { label: 'Total Notes', value: stats.totalNotes, sub: `${stats.activitiesThisWeek} activities this week`, icon: FileText, color: 'text-primary' },
    { label: 'Shared Notes', value: stats.sharedNotes, sub: 'Active shared docs', icon: Share2, color: 'text-accent' },
    { label: 'Favorites', value: stats.favoriteNotes + stats.favoriteGroups, sub: 'Pinned items', icon: Star, color: 'text-yellow-400' },
    { label: 'Bin Items', value: stats.binItems, sub: 'In trash', icon: Clock, color: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className="glass-card p-6 rounded-2xl group cursor-default"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-white/[0.03] ${stat.color} group-hover:bg-white/[0.05] transition-colors`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-xs text-muted-foreground/60">{stat.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
