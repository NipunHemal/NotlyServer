
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FolderOpen, MoreVertical, Plus, Lock, Users, Star } from 'lucide-react';
import { Group, useStore } from '@/store/use-store';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface GroupTreeItemProps {
  group: Group;
  level: number;
}

const GroupTreeItem = ({ group, level }: GroupTreeItemProps) => {
  const params = useParams();
  const isActive = params.id === group.id;
  const { groups } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const subGroups = groups.filter(g => g.parentId === group.id);
  const hasSubGroups = subGroups.length > 0;

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer relative",
          isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-white/[0.03] text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
      >
        <button 
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            "p-0.5 rounded-md hover:bg-white/10 transition-transform",
            isExpanded && "rotate-90",
            !hasSubGroups && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <Link href={`/groups/${group.id}`} className="flex-1 flex items-center gap-2 overflow-hidden">
          {isExpanded ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0" />}
          <span className="truncate text-sm">{group.name}</span>
          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {group.isLocked && <Lock className="w-3 h-3 text-muted-foreground/50" />}
            <span className="text-[10px] text-muted-foreground/50 bg-white/[0.05] px-1 rounded">{group.noteCount}</span>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 glass-panel">
            <DropdownMenuItem className="gap-2"><Plus className="w-4 h-4" /> Create Sub Group</DropdownMenuItem>
            <DropdownMenuItem className="gap-2">Rename</DropdownMenuItem>
            <DropdownMenuItem className="gap-2">Move</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2"><Star className="w-4 h-4" /> Add Favorite</DropdownMenuItem>
            <DropdownMenuItem className="gap-2"><Lock className="w-4 h-4" /> Lock Group</DropdownMenuItem>
            <DropdownMenuItem className="gap-2"><Users className="w-4 h-4" /> Share</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive">Archive</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive font-bold">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {subGroups.map(sub => (
              <GroupTreeItem key={sub.id} group={sub} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function GroupTreeSidebar() {
  const { groups } = useStore();
  const rootGroups = groups.filter(g => !g.parentId);

  return (
    <div className="w-64 flex flex-col h-full border-r border-white/5 bg-white/[0.01] overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hierarchy</h3>
        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg hover:bg-white/5">
          <Plus className="w-4 h-4 text-primary" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-8 custom-scrollbar">
        {rootGroups.map(group => (
          <GroupTreeItem key={group.id} group={group} level={0} />
        ))}
      </div>
    </div>
  );
}
