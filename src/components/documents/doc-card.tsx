
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Note, useStore, FileType } from '@/store/use-store';
import { 
  MoreVertical, Star, Lock, Sparkles, Clock, Tag, 
  FileText, Image as ImageIcon, FileCode, FileSpreadsheet, File as FileIcon,
  Download, Eye, RefreshCcw, Trash
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DocCardProps {
  note: Note;
}

const getFileIcon = (type: FileType) => {
  switch (type) {
    case 'system_doc': return <FileText className="w-8 h-8 text-primary" />;
    case 'image': return <ImageIcon className="w-8 h-8 text-ai" />;
    case 'excel': return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    case 'pdf': return <FileIcon className="w-8 h-8 text-destructive" />;
    case 'text': return <FileCode className="w-8 h-8 text-accent" />;
    default: return <FileIcon className="w-8 h-8 text-muted-foreground" />;
  }
};

export function DocCard({ note }: DocCardProps) {
  const { toggleFavorite, moveToBin, restoreFromBin, permanentDeleteNote } = useStore();
  const isSystemDoc = note.fileType === 'system_doc';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-2xl p-6 flex flex-col h-full group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <Badge variant="outline" className="bg-white/[0.03] border-white/10 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
          {isSystemDoc ? note.category : note.fileType}
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
              {note.isDeleted ? (
                <>
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2 text-primary focus:text-primary"
                    onClick={() => restoreFromBin(note.id)}
                  >
                    <RefreshCcw className="w-4 h-4" /> Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    onClick={() => permanentDeleteNote(note.id)}
                  >
                    <Trash className="w-4 h-4" /> Delete Permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="cursor-pointer gap-2"><Eye className="w-4 h-4" /> View</DropdownMenuItem>
                  {!isSystemDoc && <DropdownMenuItem className="cursor-pointer gap-2"><Download className="w-4 h-4" /> Download</DropdownMenuItem>}
                  <DropdownMenuItem className="cursor-pointer gap-2"><Lock className="w-4 h-4" /> Lock</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2">Share</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    onClick={() => moveToBin(note.id)}
                  >
                    <Trash className="w-4 h-4" /> Move to Bin
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {note.title}
        </h3>
        
        <div className="min-h-[80px]">
          {isSystemDoc ? (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed italic">
              {note.content || "Empty document..."}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center h-20 bg-white/[0.02] rounded-xl border border-dashed border-white/5 group-hover:bg-primary/5 transition-colors">
              {getFileIcon(note.fileType)}
              <span className="text-[10px] font-bold text-muted-foreground mt-2">{note.fileSize}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] px-2 py-0.5 rounded border border-white/5">
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
              <span className="text-[10px] font-bold text-muted-foreground/80">{note.author}</span>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground/40 font-mono">
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
