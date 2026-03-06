
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AIAssistPanel } from './ai-assist-panel';
import { History, Share2, MoreHorizontal, Layout, Tag as TagIcon, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function DocEditor() {
  const [title, setTitle] = useState('New Project Strategy');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState(['Draft', 'Strategy']);
  const [category, setCategory] = useState('Work');
  const [summary, setSummary] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: "Note Saved", description: "All changes are synced locally and to cloud." });
  };

  return (
    <div className="flex h-full gap-8">
      {/* Main Editor Section */}
      <div className="flex-1 flex flex-col space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/10">
              <Layout className="w-5 h-5 text-primary" />
            </div>
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              All Docs <ChevronRight className="w-3 h-3" /> <span className="text-foreground">{title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mr-4">Autosaved 2m ago</span>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full"><Share2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full"><History className="w-4 h-4" /></Button>
            <Button onClick={handleSave} className="rounded-full px-6 gap-2 bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4" /> Save
            </Button>
          </div>
        </header>

        <div className="flex-1 space-y-6">
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-5xl font-black bg-transparent border-none focus-visible:ring-0 p-0 h-auto placeholder:text-muted-foreground/20"
            placeholder="Document Title"
          />
          
          <div className="flex flex-wrap gap-2 pb-6 border-b border-white/5">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none hover:bg-primary/20 px-3 py-1 text-xs">
              {category}
            </Badge>
            {tags.map(t => (
              <Badge key={t} variant="outline" className="border-white/10 text-muted-foreground px-3 py-1 text-xs">
                {t}
              </Badge>
            ))}
          </div>

          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[600px] text-xl leading-relaxed bg-transparent border-none focus-visible:ring-0 p-0 resize-none placeholder:text-muted-foreground/10"
            placeholder="Type '/' for commands or just start writing..."
          />
        </div>
      </div>

      {/* Side Meta Panels */}
      <aside className="w-80 flex flex-col gap-6 sticky top-0 h-fit">
        <AIAssistPanel 
          content={content} 
          onApplyTags={(newTags) => setTags(prev => Array.from(new Set([...prev, ...newTags])))}
          onApplyCategory={setCategory}
          onApplySummary={setSummary}
        />

        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Properties</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><Layout className="w-4 h-4" /> Group</span>
              <span className="font-medium">Projects 2024</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><TagIcon className="w-4 h-4" /> Status</span>
              <span className="text-accent font-bold px-2 py-0.5 rounded bg-accent/10">In Progress</span>
            </div>
          </div>
        </div>

        {summary && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-2xl bg-primary/5 border-primary/20"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">AI Executive Summary</h3>
            <p className="text-sm leading-relaxed text-muted-foreground/90">
              {summary}
            </p>
          </motion.div>
        )}
      </aside>
    </div>
  );
}
