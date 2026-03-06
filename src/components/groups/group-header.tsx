
"use client";

import React from 'react';
import { Group } from '@/store/use-store';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderPlus, 
  Share2, 
  Lock, 
  Star, 
  Settings, 
  Search,
  Users,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface GroupHeaderProps {
  group: Group;
}

export function GroupHeader({ group }: GroupHeaderProps) {
  return (
    <header className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Plus className="w-8 h-8 rotate-45" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                {group.name}
                {group.isLocked && <Lock className="w-5 h-5 text-muted-foreground/40" />}
              </h1>
              <p className="text-muted-foreground mt-1 line-clamp-2">
                {group.description || "No description provided for this group."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Created on Oct 12, 2024
            </div>
            <div className="flex items-center -space-x-2">
              {[1, 2, 3].map((i) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-background">
                  <AvatarImage src={`https://picsum.photos/seed/collab${i}/50/50`} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              ))}
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                +2
              </div>
              <span className="ml-4 font-medium">5 Collaborators</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TooltipProvider>
            <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-2xl p-1 gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5">
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Note</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5">
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create Sub-Group</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-2xl p-1 gap-1">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5">
                <Lock className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5">
                <Star className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-white/5 border border-white/5">
              <Settings className="w-5 h-5" />
            </Button>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
