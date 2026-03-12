
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TiptapEditor } from './tiptap-editor';
import { AIAssistPanel } from './ai-assist-panel';
import { 
  History, Share2, ChevronRight, Save, 
  Sparkles, MessageSquare, Lock, Star, 
  MoreVertical, Clock, Check, Loader2,
  Tag as TagIcon, Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { VersionTimeline } from './version-timeline';
import { useStore } from '@/store/use-store';
import { Input } from '@/components/ui/input';

export function DocumentEditor() {
  const { notes, selectedNoteId, updateNote, createVersion, isSaving } = useStore();
  const note = notes.find(n => n.id === selectedNoteId);
  
  const [title, setTitle] = useState(note?.title || '');
  const [showAI, setShowAI] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
  }, [note?.id]);

  const handleCreateVersion = () => {
    if (selectedNoteId) {
      createVersion(selectedNoteId, `Backup - ${new Date().toLocaleTimeString()}`);
      toast({ title: "Version Captured", description: "Safe point created." });
    }
  };

  if (!note) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-muted-foreground space-y-4">
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
        <Layout className="w-12 h-12 opacity-10" />
      </div>
      <p className="text-sm font-bold tracking-widest uppercase opacity-20">Select a document to begin</p>
    </div>
  );

  return (
    <div className="flex h-full gap-12 relative pb-20">
      {/* Main Editor Section */}
      <div className="flex-1 flex flex-col space-y-12 min-w-0 max-w-4xl mx-auto">
        <header className="flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md py-4">
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-muted-foreground flex items-center gap-2 uppercase tracking-[0.2em]">
              Workspace <ChevronRight className="w-3 h-3 opacity-30" /> <span className="text-foreground">{note.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-6">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  Synced
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-white/5"><Share2 className="w-3.5 h-3.5" /></Button>
              <Button 
                variant={showVersions ? "secondary" : "ghost"} 
                size="icon" 
                className="w-8 h-8 rounded-lg"
                onClick={() => { setShowVersions(!showVersions); setShowAI(false); }}
              >
                <History className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant={showAI ? "secondary" : "ghost"} 
                size="icon" 
                className="w-8 h-8 rounded-lg text-ai"
                onClick={() => { setShowAI(!showAI); setShowVersions(false); }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Button className="rounded-xl h-10 px-6 gap-2 bg-primary hover:bg-primary/90 font-bold text-sm shadow-xl shadow-primary/20">
              <Save className="w-4 h-4" /> Save
            </Button>
          </div>
        </header>

        <div className="space-y-10">
          <Input 
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              updateNote(note.id, { title: e.target.value });
            }}
            className="text-6xl font-black bg-transparent border-none focus-visible:ring-0 p-0 h-auto placeholder:text-muted-foreground/10 tracking-tight"
            placeholder="Untitled document"
          />
          
          <div className="flex flex-wrap items-center gap-4 pb-10 border-b border-white/5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
              <Layout className="w-3 h-3" /> {note.category}
            </div>
            {note.tags.map(t => (
              <Badge key={t} variant="outline" className="border-white/10 text-muted-foreground/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full">
                <TagIcon className="w-2.5 h-2.5 mr-1" /> {t}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-8 rounded-full text-[10px] font-bold text-muted-foreground hover:bg-white/5">
              + Add Property
            </Button>
          </div>

          <TiptapEditor 
            content={note.content} 
            onUpdate={(html) => updateNote(note.id, { content: html })} 
          />
        </div>
      </div>

      {/* Slide-in Panels Container */}
      <AnimatePresence>
        {(showAI || showVersions) && (
          <motion.aside 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-96 flex flex-col gap-8 sticky top-24 h-fit"
          >
            {showAI && (
              <AIAssistPanel 
                content={note.content} 
                onApplyTags={(tags) => updateNote(note.id, { tags: Array.from(new Set([...note.tags, ...tags])) })}
                onApplyCategory={(cat) => updateNote(note.id, { category: cat })}
                onApplySummary={(sum) => updateNote(note.id, { summary: sum })}
              />
            )}

            {showVersions && (
              <VersionTimeline 
                noteId={note.id} 
                onSnapshot={handleCreateVersion}
              />
            )}
            
            <div className="glass-panel p-8 rounded-[2.5rem] space-y-6 border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Collaborators</h3>
                <Badge variant="outline" className="text-[9px] font-black bg-green-500/10 text-green-500 border-none">3 Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-card bg-muted overflow-hidden ring-2 ring-background">
                      <img src={`https://picsum.photos/seed/editor-${i}/40/40`} alt="Collaborator" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-4 border-card bg-white/5 flex items-center justify-center text-[10px] font-bold ring-2 ring-background">+2</div>
                </div>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-2xl bg-white/[0.03] text-primary border border-white/10 hover:bg-primary/10">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
