
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Note } from '@/service/functions/note.service';
import {
  MoreVertical, Star, Lock, Clock, FileText,
  Trash2, Archive, Copy, Share2, ArrowRightLeft, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useToggleNoteFavorite,
  useDeleteNote,
  useArchiveNote,
  useDuplicateNote,
  usePublicLink,
} from '@/service/query/useNote';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const toggleFavoriteMutation = useToggleNoteFavorite();
  const deleteMutation = useDeleteNote(note.group_id);
  const archiveMutation = useArchiveNote();
  const duplicateMutation = useDuplicateNote();
  const publicLinkMutation = usePublicLink();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Extract a text preview from content or content_json
  const getPreview = (): string => {
    if (note.content && note.content.trim()) return note.content;
    if (note.content_json) {
      try {
        const json = typeof note.content_json === 'string' ? JSON.parse(note.content_json) : note.content_json;
        const extractText = (node: any): string => {
          if (node.text) return node.text;
          if (node.content) return node.content.map(extractText).join(' ');
          return '';
        };
        const text = extractText(json).trim();
        return text || 'Empty document…';
      } catch {
        return 'Empty document…';
      }
    }
    return 'Empty document…';
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all overflow-hidden"
    >
      {/* Clickable area */}
      <Link href={`/notes/${note.id}`} className="block p-5 pb-3 space-y-3">
        {/* Status badges */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-0 rounded-md border",
              note.status === 'ARCHIVED'
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                : "bg-white/[0.03] border-white/10 text-muted-foreground/60"
            )}
          >
            {note.status === 'ARCHIVED' ? 'Archived' : 'Note'}
          </Badge>
          {note.is_locked && (
            <Lock className="w-3 h-3 text-orange-400" />
          )}
          {note.is_favorite && (
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {note.title || 'Untitled'}
        </h3>

        {/* Preview */}
        <p className="text-[13px] text-muted-foreground/50 line-clamp-2 leading-relaxed">
          {getPreview()}
        </p>
      </Link>

      {/* Footer */}
      <div className="px-5 pb-4 pt-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 font-medium">
          <Clock className="w-3 h-3" />
          <span>{formatDate(note.updated_at)}</span>
          <span className="mx-1">·</span>
          <span>v{note.version_number || 1}</span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Favorite toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
              note.is_favorite ? "text-yellow-500 opacity-100" : "text-muted-foreground/40 hover:text-yellow-500"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavoriteMutation.mutate(note.id);
            }}
          >
            <Star className={cn("w-3.5 h-3.5", note.is_favorite && "fill-current")} />
          </Button>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-foreground"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
              <DropdownMenuItem asChild className="rounded-lg gap-2.5 cursor-pointer text-[13px]">
                <Link href={`/notes/${note.id}`}>
                  <ExternalLink className="w-4 h-4" /> Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg gap-2.5 cursor-pointer text-[13px]"
                onClick={() => duplicateMutation.mutate(note.id)}
              >
                <Copy className="w-4 h-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg gap-2.5 cursor-pointer text-[13px]">
                <ArrowRightLeft className="w-4 h-4" /> Move to…
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg gap-2.5 cursor-pointer text-[13px]"
                onClick={() => publicLinkMutation.mutate(note.id)}
              >
                <Share2 className="w-4 h-4" /> Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg gap-2.5 cursor-pointer text-[13px]"
                onClick={() => archiveMutation.mutate(note.id)}
              >
                <Archive className="w-4 h-4" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg gap-2.5 cursor-pointer text-[13px] text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => {
                  if (confirm('Move this note to bin?')) deleteMutation.mutate(note.id);
                }}
              >
                <Trash2 className="w-4 h-4" /> Move to Bin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
