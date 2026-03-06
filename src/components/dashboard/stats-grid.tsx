
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Share2, Star, Clock } from 'lucide-react';

interface StatItem {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
}

const stats: StatItem[] = [
  { label: 'Total Notes', value: '1,284', sub: '+12 this week', icon: FileText, color: 'text-primary' },
  { label: 'Shared Notes', value: '42', sub: '3 active shares', icon: Share2, color: 'text-accent' },
  { label: 'Favorites', value: '18', sub: 'Pinned for quick access', icon: Star, color: 'text-yellow-400' },
  { label: 'Reminders', value: '7', sub: '2 due today', icon: Clock, color: 'text-destructive' },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
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
