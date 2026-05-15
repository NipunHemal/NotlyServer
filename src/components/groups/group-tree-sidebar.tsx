
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FolderOpen, MoreVertical, Plus, Lock, Users, Star, Loader2 } from 'lucide-react';
import { useStore } from '@/store/use-store';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useGroupTree, useToggleGroupFavorite, useDeleteGroup, useArchiveGroup } from '@/service/query/useGroup';
import { GroupTreeNode } from '@/service/functions/group.service';
import { Edit2, Move, Share2, Archive, Trash2 } from 'lucide-react';

interface GroupTreeItemProps {
  group: GroupTreeNode;
  level: number;
}

const GroupTreeItem = ({ group, level }: GroupTreeItemProps) => {
  const params = useParams();
  const isActive = params.id === group.id;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasSubGroups = group.children && group.children.length > 0;
  const toggleFavorite = useToggleGroupFavorite();
  const deleteGroup = useDeleteGroup();
  const archiveGroup = useArchiveGroup();
  const { setCreateGroupModalOpen, setRenameGroup, setMoveGroup, setShareGroup } = useStore();

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
          {isExpanded ? <FolderOpen className="w-4 h-4 shrink-0 text-primary/60" /> : <Folder className="w-4 h-4 shrink-0" />}
          <span className="truncate text-sm">{group.name}</span>
          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {group.is_locked && <Lock className="w-3 h-3 text-muted-foreground/50" />}
            {group.is_favorite && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 glass-panel border-white/10 bg-popover/90 backdrop-blur-xl">
            <DropdownMenuItem 
              className="gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCreateGroupModalOpen(true, group.id);
              }}
            >
              <Plus className="w-4 h-4" /> Create Sub Group
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setRenameGroup(group.id);
              }}
            >
              <Edit2 className="w-4 h-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setMoveGroup(group.id);
              }}
            >
              <Move className="w-4 h-4" /> Move
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem 
              className="gap-2 cursor-pointer"
              onClick={() => toggleFavorite.mutate(group.id)}
            >
              <Star className={cn("w-4 h-4", group.is_favorite && "fill-current text-yellow-500")} /> 
              {group.is_favorite ? 'Remove Favorite' : 'Add Favorite'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShareGroup(group.id);
              }}
            >
              <Share2 className="w-4 h-4" /> Share
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem 
              className="gap-2 text-destructive cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                archiveGroup.mutate(group.id);
              }}
            >
              <Archive className="w-4 h-4" /> Archive
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="gap-2 text-destructive font-bold cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if(confirm(`Are you sure you want to delete "${group.name}"?`)) deleteGroup.mutate(group.id);
              }}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence>
        {isExpanded && hasSubGroups && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {group.children.map(sub => (
              <GroupTreeItem key={sub.id} group={sub} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function GroupTreeSidebar() {
  const { user, setCreateGroupModalOpen, selectedWorkspaceId } = useStore();
  const { data: groupTree, isLoading } = useGroupTree(selectedWorkspaceId || '');

  return (
    <div className="w-64 flex flex-col h-full border-r border-white/5 bg-white/[0.01] overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Hierarchy</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-7 h-7 rounded-lg hover:bg-white/5 text-primary"
          onClick={() => setCreateGroupModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-8 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/20" />
          </div>
        ) : groupTree && groupTree.length > 0 ? (
          groupTree.map(group => (
            <GroupTreeItem key={group.id} group={group} level={0} />
          ))
        ) : (
          <div className="px-4 py-8 text-center space-y-2">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No groups yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
