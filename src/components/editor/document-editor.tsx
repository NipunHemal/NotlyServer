
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AIAssistPanel } from './ai-assist-panel';
import { 
  History, Share2, Layout, Tag as TagIcon, ChevronRight, Save, 
  Bold, Italic, List, ListOrdered, CheckSquare, Image as ImageIcon, 
  Table as TableIcon, Code, Quote, Divide, Sparkles, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { VersionTimeline } from './version-timeline';
import { useStore } from '@/store/use-store';

export function DocumentEditor() {
  const { notes, selectedNoteId, updateNote, createVersion } = useStore();
  const note = notes.find(n => n.id === selectedNoteId);
  
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [showAI, setShowAI] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.id]);

  const handleSave = () => {
    if (selectedNoteId) {
      updateNote(selectedNoteId, { title, content });
      toast({ title: "Note Saved", description: "Changes synced." });
    }
  };

  const handleCreateVersion = () => {
    if (selectedNoteId) {
      createVersion(selectedNoteId, `Manual Save - ${new Date().toLocaleTimeString()}`);
      toast({ title: "Version Created", description: "Document state snapshotted." });
    }
  };

  if (!note) return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select a document to edit.
    </div>
  );

  return (
    <div className="flex h-full gap-8 relative">
      {/* Main Editor Section */}
      <div className="flex-1 flex flex-col space-y-8 min-w-0">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
              Documents <ChevronRight className="w-3 h-3" /> <span className="text-foreground">{title || 'Untitled'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mr-4">Live Sync Active</span>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl"><Share2 className="w-4 h-4" /></Button>
            <Button 
              variant={showVersions ? "secondary" : "ghost"} 
              size="icon" 
              className="w-9 h-9 rounded-xl"
              onClick={() => setShowVersions(!showVersions)}
            >
              <History className="w-4 h-4" />
            </Button>
            <Button 
              variant={showAI ? "secondary" : "ghost"} 
              size="icon" 
              className="w-9 h-9 rounded-xl text-ai"
              onClick={() => setShowAI(!showAI)}
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button onClick={handleSave} className="rounded-xl px-6 gap-2 bg-primary hover:bg-primary/90 font-bold">
              <Save className="w-4 h-4" /> Save
            </Button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/5 w-fit">
          {[Bold, Italic, Code, Link, List, ListOrdered, CheckSquare, ImageIcon, TableIcon, Quote, Divide].map((Icon, i) => (
            <Button key={i} variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground">
              <Icon className="w-4 h-4" />
            </Button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-1" />
          <Button variant="ghost" className="h-8 text-[10px] font-black uppercase px-3 text-ai hover:text-ai hover:bg-ai/10 gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> AI Command
          </Button>
        </div>

        <div className="flex-1 flex flex-col space-y-6 max-w-4xl mx-auto w-full">
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-5xl font-black bg-transparent border-none focus-visible:ring-0 p-0 h-auto placeholder:text-muted-foreground/10 tracking-tight"
            placeholder="Document Title"
          />
          
          <div className="flex flex-wrap gap-2 pb-6 border-b border-white/5">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none hover:bg-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
              {note.category}
            </Badge>
            {note.tags.map(t => (
              <Badge key={t} variant="outline" className="border-white/10 text-muted-foreground/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {t}
              </Badge>
            ))}
          </div>

          <div className="relative group flex-1">
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-[600px] text-lg leading-relaxed bg-transparent border-none focus-visible:ring-0 p-0 resize-none placeholder:text-muted-foreground/10"
              placeholder="Press '/' for commands..."
            />
          </div>
        </div>
      </div>

      {/* Slide-in Panels Container */}
      <AnimatePresence>
        {(showAI || showVersions) && (
          <motion.aside 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 flex flex-col gap-6 sticky top-0 h-fit"
          >
            {showAI && (
              <AIAssistPanel 
                content={content} 
                onApplyTags={(tags) => updateNote(note.id, { tags: [...note.tags, ...tags] })}
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
            
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Collaboration</h3>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                      <img src={`https://picsum.photos/seed/editor-${i}/32/32`} alt="Collaborator" />
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl bg-white/[0.03] text-primary">
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
