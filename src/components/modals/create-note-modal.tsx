
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/use-store';
import { useToast } from '@/hooks/use-toast';
import { FileText, Tag as TagIcon, Layout, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateNoteModal() {
  const { isCreateNoteModalOpen, setCreateNoteModalOpen, addNote, groups } = useStore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work');
  const [groupId, setGroupId] = useState<string>('');
  const [tags, setTags] = useState('');

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    const id = addNote({
      title,
      content: '<h1>' + title + '</h1><p>Start writing here...</p>',
      category,
      groupId: groupId === 'none' ? undefined : groupId,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
    });

    toast({ title: "Document Created", description: "Taking you to the editor..." });
    
    // Reset and navigate
    setTitle('');
    setCategory('Work');
    setGroupId('');
    setTags('');
    setCreateNoteModalOpen(false);
    
    router.push('/docs'); // Ensure they are on the docs page where DocumentEditor renders
  };

  return (
    <Dialog open={isCreateNoteModalOpen} onOpenChange={setCreateNoteModalOpen}>
      <DialogContent className="sm:max-w-[550px] glass-panel border-white/10 text-white rounded-[2.5rem] p-10">
        <DialogHeader className="space-y-4">
          <div className="w-16 h-16 rounded-[1.75rem] bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-3xl font-black tracking-tight">New Knowledge Doc</DialogTitle>
            <DialogDescription className="text-muted-foreground text-md">
              Start a new thought or organize an existing project.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Q4 Growth Strategy" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/[0.03] border-white/10 h-14 text-xl font-bold px-4 rounded-2xl focus:border-primary/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layout className="w-3 h-3" /> Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 h-12 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/10">
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Ideas">Ideas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layout className="w-3 h-3" /> Group
              </Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 h-12 rounded-xl">
                  <SelectValue placeholder="Root level" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/10">
                  <SelectItem value="none">Root level (No group)</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TagIcon className="w-3 h-3" /> Tags (comma separated)
            </Label>
            <Input 
              id="tags" 
              placeholder="strategy, draft, internal" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-white/[0.03] border-white/10 h-12 rounded-xl px-4"
            />
          </div>
        </div>

        <DialogFooter className="gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setCreateNoteModalOpen(false)} 
            className="rounded-2xl px-8 h-12 border border-white/5 hover:bg-white/5 font-bold"
          >
            Discard
          </Button>
          <Button 
            onClick={handleCreate} 
            className="rounded-2xl px-10 h-12 font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20"
          >
            Create & Open Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
