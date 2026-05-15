
"use client";

import React from 'react';
import { Group } from '@/service/functions/group.service';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderPlus, 
  Share2, 
  Lock, 
  Star, 
  Settings, 
  Clock,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useToggleGroupFavorite, useCollaborators } from '@/service/query/useGroup';
import { useStore } from '@/store/use-store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface GroupHeaderProps {
  group: Group;
}

export function GroupHeader({ group }: GroupHeaderProps) {
  const toggleFavorite = useToggleGroupFavorite();
  const { data: collaborators } = useCollaborators(group.id);
  const { setCreateGroupModalOpen, setShareGroup, setRenameGroup } = useStore();

  return (
    <header className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Plus className="w-10 h-10 rotate-45" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                {group.name}
                {group.is_locked && <Lock className="w-5 h-5 text-muted-foreground/30" />}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Management and organization of {group.name} knowledge base and related assets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center border border-white/5">
                <Clock className="w-3 h-3" />
              </div>
              Created {(() => {
                try {
                  const date = new Date(group.created_at);
                  return isNaN(date.getTime()) ? 'Recently' : format(date, 'MMM dd, yyyy');
                } catch {
                  return 'Recently';
                }
              })()}
            </div>

            {collaborators && collaborators.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  {collaborators.slice(0, 3).map((collab) => (
                    <Avatar key={collab.id} className="w-7 h-7 border-2 border-background">
                      <AvatarImage src={collab.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.user.username}`} />
                      <AvatarFallback>{collab.user.displayName[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                  {collaborators.length > 3 && (
                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-black">
                      +{collaborators.length - 3}
                    </div>
                  )}
                </div>
                <span className="font-black text-primary/40">{collaborators.length} Contributors</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TooltipProvider>
            <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 gap-1.5 shadow-xl">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover/90 backdrop-blur-md border-white/10">Add Note</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setCreateGroupModalOpen(true, group.id)}
                    className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center"
                  >
                    <FolderPlus className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover/90 backdrop-blur-md border-white/10">Create Sub-Group</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 gap-1.5 shadow-xl">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 rounded-xl hover:bg-white/10 transition-all"
                onClick={() => setShareGroup(group.id)}
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-white/10 transition-all">
                <Lock className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "w-10 h-10 rounded-xl transition-all",
                  group.is_favorite ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20" : "hover:bg-white/10"
                )}
                onClick={() => toggleFavorite.mutate(group.id)}
              >
                <Star className={cn("w-5 h-5", group.is_favorite && "fill-current")} />
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="w-11 h-11 rounded-xl hover:bg-white/10 border border-white/5 shadow-xl"
              onClick={() => setRenameGroup(group.id)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
