
"use client";

import React from 'react';
import { useNoteVersions, useRestoreVersion } from '@/service/query/useNote';
import { NoteVersion } from '@/service/functions/note.service';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw, User, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VersionHistorySidebarProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  currentVersionNumber: number;
}

export function VersionHistorySidebar({ noteId, isOpen, onClose, currentVersionNumber }: VersionHistorySidebarProps) {
  const { data: versionsData, isLoading } = useNoteVersions(noteId);
  const restoreMutation = useRestoreVersion();

  const handleRestore = (versionId: string) => {
    if (confirm("This will revert the document to this version. Your current changes will be saved as a new version first. Proceed?")) {
      restoreMutation.mutate({ id: noteId, versionId }, {
        onSuccess: () => onClose()
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-96 glass-panel border-l border-white/5 bg-popover/95 backdrop-blur-3xl p-0">
        <SheetHeader className="p-8 border-b border-white/5">
          <SheetTitle className="text-2xl font-black tracking-tight">Intelligence History</SheetTitle>
          <SheetDescription className="text-muted-foreground font-medium">
            Review and restore previous states of this intelligence unit.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Querying Archives...</p>
              </div>
            ) : versionsData?.content.map((version) => (
              <div 
                key={version.id}
                className={cn(
                  "group p-4 rounded-2xl border transition-all relative overflow-hidden",
                  version.version_number === currentVersionNumber 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                {version.version_number === currentVersionNumber && (
                  <div className="absolute top-0 right-0 p-2">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                )}
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Version {version.version_number}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/60">
                      {version.created_at ? (
                        (() => {
                          const date = new Date(version.created_at);
                          return isNaN(date.getTime()) ? 'Unknown' : formatDistanceToNow(date, { addSuffix: true });
                        })()
                      ) : 'Unknown'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm truncate">{version.title}</h4>

                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                      <User className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {version.created_by.display_name || version.created_by.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-muted-foreground/50 border border-white/5">
                      {version.change_summary}
                    </span>
                  </div>

                  {version.version_number !== currentVersionNumber && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="mt-2 w-full h-9 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                      onClick={() => handleRestore(version.id)}
                      disabled={restoreMutation.isPending}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore Version
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
