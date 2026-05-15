
"use client";

import React from 'react';
import { Group, GroupTreeNode } from '@/service/functions/group.service';
import { motion } from 'framer-motion';
import { Folder, MoreVertical, FileText, Clock, Archive, Trash2, Move, Edit2, Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useDeleteGroup, useToggleGroupFavorite } from '@/service/query/useGroup';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface GroupCardProps {
  group: Group | GroupTreeNode;
}

export function GroupCard({ group }: GroupCardProps) {
  const deleteMutation = useDeleteGroup();
  const favoriteMutation = useToggleGroupFavorite();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    favoriteMutation.mutate(group.id);
  };

  // Type guard or simple check for Group properties missing in GroupTreeNode
  const isFullGroup = (g: Group | GroupTreeNode): g is Group => {
    return 'updated_at' in g;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-panel rounded-[2rem] p-6 flex flex-col h-full group/card relative overflow-hidden cursor-pointer border-white/5 hover:border-primary/20 transition-all"
    >
      <Link href={`/groups/${group.id}`} className="absolute inset-0 z-0" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/10 text-primary group-hover/card:bg-primary/10 group-hover/card:scale-110 transition-all">
            <Folder className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-1">
            {group.is_locked && <Lock className="w-4 h-4 text-muted-foreground/30 mr-1" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity z-20 hover:bg-white/5">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 glass-panel border-white/10 bg-popover/90 backdrop-blur-xl p-1.5">
                <DropdownMenuItem className="gap-2 rounded-xl cursor-pointer"><Edit2 className="w-4 h-4" /> Rename</DropdownMenuItem>
                <DropdownMenuItem className="gap-2 rounded-xl cursor-pointer"><Move className="w-4 h-4" /> Move</DropdownMenuItem>
                <DropdownMenuItem className="gap-2 rounded-xl cursor-pointer" onClick={toggleFavorite}>
                  <Star className={cn("w-4 h-4", group.is_favorite && "fill-current text-yellow-500")} /> 
                  {group.is_favorite ? 'Remove Favorite' : 'Add Favorite'}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 rounded-xl cursor-pointer"><Archive className="w-4 h-4" /> Archive</DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 rounded-xl text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-bold"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <h3 className="text-xl font-black tracking-tight group-hover/card:text-primary transition-colors leading-tight">{group.name}</h3>
          <p className="text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed font-medium">
             Comprehensive collection of documents and intelligence assets related to {group.name}.
          </p>
        </div>

        <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.1em]">
            <span className="flex items-center gap-1.5 group-hover/card:text-primary/60 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              Intelligence Unit
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {(() => {
                if (!isFullGroup(group) || !group.updated_at) return 'Recently';
                try {
                  const date = new Date(group.updated_at);
                  return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
                } catch {
                  return 'Recently';
                }
              })()}
            </span>
          </div>
          
          {group.is_favorite && (
            <Star className="w-4 h-4 text-yellow-500/50 fill-current" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
