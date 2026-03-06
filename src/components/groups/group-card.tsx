
"use client";

import React from 'react';
import { Group } from '@/store/use-store';
import { motion } from 'framer-motion';
import { Folder, MoreVertical, FileText, Clock, Archive, Trash2, Move, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-2xl p-5 flex flex-col h-full group/card relative overflow-hidden cursor-pointer"
    >
      <Link href={`/groups/${group.id}`} className="absolute inset-0 z-0" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/10 text-primary group-hover/card:bg-primary/10 transition-colors">
            <Folder className="w-6 h-6" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 glass-panel border-white/10">
              <DropdownMenuItem className="gap-2"><Edit2 className="w-4 h-4" /> Rename</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><Move className="w-4 h-4" /> Move</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><Archive className="w-4 h-4" /> Archive</DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-tight group-hover/card:text-primary transition-colors">{group.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {group.description || "No description provided."}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {group.noteCount} Notes
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {group.lastModified}
            </span>
          </div>
          
          <div className="flex -space-x-1.5">
            {[1, 2].map(i => (
              <div key={i} className="w-5 h-5 rounded-full border border-background overflow-hidden">
                <img src={`https://picsum.photos/seed/thumb${i}/20/20`} alt="Note Preview" className="w-full h-full object-cover grayscale opacity-50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
