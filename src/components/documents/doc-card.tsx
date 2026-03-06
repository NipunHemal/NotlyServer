
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Note, useStore } from '@/store/use-store';
import { MoreVertical, Star, Lock, Sparkles, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DocCardProps {
  note: Note;
}

export function DocCard({ note }: DocCardProps) {
  const { toggleFavorite, deleteNote } = useStore();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-2xl p-6 flex flex-col h-full group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <Badge variant="outline" className="bg-white/[0.03] border-white/10 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
          {note.category}
        </Badge>
        <div className="flex items-center gap-1">
          {note.isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
          {note.hasAI && <Sparkles className="w-3.5 h-3.5 text-ai animate-pulse" />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-white/10">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 glass-panel border-white/10">
              <DropdownMenuItem className="cursor-pointer gap-2"><Lock className="w-4 h-4" /> Lock</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2">Share</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2">Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                onClick={() => deleteNote(note.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {note.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {note.content}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-white/[0.02] px-2 py-0.5 rounded border border-white/5">
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 border border-white/10">
              <AvatarImage src={`https://picsum.photos/seed/${note.id}/50/50`} />
              <AvatarFallback>{note.author.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-foreground/80">{note.author}</span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                <Clock className="w-2.5 h-2.5" />
                {note.lastEdited}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-8 h-8 rounded-full ${note.isFavorite ? 'text-yellow-400' : 'text-muted-foreground/40'} hover:bg-white/10`}
            onClick={() => toggleFavorite(note.id)}
          >
            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
