
"use client";

import React from 'react';
import { useStore, DocVersion } from '@/store/use-store';
import { motion } from 'framer-motion';
import { History, Plus, RotateCcw, Eye, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface VersionTimelineProps {
  noteId: string;
  onSnapshot: () => void;
}

export function VersionTimeline({ noteId, onSnapshot }: VersionTimelineProps) {
  const { notes, restoreVersion } = useStore();
  const note = notes.find(n => n.id === noteId);
  const versions = note?.versions || [];

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 max-h-[500px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <History className="w-5 h-5" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">History</h3>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold px-3 gap-1.5"
          onClick={onSnapshot}
        >
          <Plus className="w-4 h-4" /> Snapshot
        </Button>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="relative space-y-8 pl-4 border-l border-white/5">
          {versions.length > 0 ? (
            versions.map((version, idx) => (
              <div key={version.id} className="relative">
                {/* Connector Dot */}
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white/10 border-2 border-background group-hover:bg-primary transition-colors" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground line-clamp-1">{version.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{version.timestamp}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {version.author}</span>
                    <span className="flex items-center gap-1 font-mono">{version.wordCount} words</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] rounded-lg px-2 hover:bg-white/5 gap-1.5"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] rounded-lg px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
                      onClick={() => restoreVersion(noteId, version.id)}
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-2">
              <Clock className="w-8 h-8 text-muted-foreground/20 mx-auto" />
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">No versions recorded</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
