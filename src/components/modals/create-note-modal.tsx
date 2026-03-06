
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
import { FileText, Tag as TagIcon, Layout } from 'lucide-react';

export function CreateNoteModal() {
  const { isCreateNoteModalOpen, setCreateNoteModalOpen, addNote, groups } = useStore();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Work');
  const [groupId, setGroupId] = useState<string>('');
  const [tags, setTags] = useState('');

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    addNote({
      title,
      content,
      category,
      groupId: groupId || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
    });

    toast({ title: "Note Created", description: `${title} has been added to your docs.` });
    
    // Reset and close
    setTitle('');
    setContent('');
    setCategory('Work');
    setGroupId('');
    setTags('');
    setCreateNoteModalOpen(false);
  };

  return (
    <Dialog open={isCreateNoteModalOpen} onOpenChange={setCreateNoteModalOpen}>
      <DialogContent className="sm:max-w-[500px] glass-panel border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            Create New Document
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Start a new thought or organize an existing project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Document Title</Label>
            <Input 
              id="title" 
              placeholder="Enter title..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/[0.03] border-white/10 h-12 text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layout className="w-3 h-3" /> Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 h-10">
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
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layout className="w-3 h-3" /> Group
              </Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 h-10">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/10">
                  <SelectItem value="none">No Group</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TagIcon className="w-3 h-3" /> Tags
            </Label>
            <Input 
              id="tags" 
              placeholder="e.g. strategy, 2024, draft" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-white/[0.03] border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Content</Label>
            <Textarea 
              id="content" 
              placeholder="Start typing..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-white/[0.03] border-white/10 min-h-[120px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => setCreateNoteModalOpen(false)} className="rounded-xl px-6 border border-white/5 hover:bg-white/5">
            Cancel
          </Button>
          <Button onClick={handleCreate} className="rounded-xl px-8 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            Create Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
