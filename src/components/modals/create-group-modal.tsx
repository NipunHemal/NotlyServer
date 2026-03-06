
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
import { FolderPlus, Layers, Lock, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function CreateGroupModal() {
  const { isCreateGroupModalOpen, setCreateGroupModalOpen, addGroup, groups } = useStore();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    addGroup({
      name,
      description,
      parentId: parentId === 'none' ? undefined : parentId,
      isLocked,
      isShared,
    });

    toast({ title: "Group Created", description: `${name} folder is ready.` });
    
    // Reset and close
    setName('');
    setDescription('');
    setParentId('');
    setIsLocked(false);
    setIsShared(false);
    setCreateGroupModalOpen(false);
  };

  return (
    <Dialog open={isCreateGroupModalOpen} onOpenChange={setCreateGroupModalOpen}>
      <DialogContent className="sm:max-w-[450px] glass-panel border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <FolderPlus className="w-5 h-5" />
            </div>
            New Knowledge Group
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Group your documents to build a structured workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Group Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Legal Research" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/[0.03] border-white/10 h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Layers className="w-3 h-3" /> Nest Under (Optional)
            </Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger className="bg-white/[0.03] border-white/10 h-10">
                <SelectValue placeholder="Root Level" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-white/10">
                <SelectItem value="none">Root Level (No Parent)</SelectItem>
                {groups.filter(g => !g.parentId).map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea 
              id="desc" 
              placeholder="What is this group for?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/[0.03] border-white/10 min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Private & Locked
                </div>
                <div className="text-xs text-muted-foreground">Requires a password to view contents.</div>
              </div>
              <Switch checked={isLocked} onCheckedChange={setIsLocked} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Enable Collaboration
                </div>
                <div className="text-xs text-muted-foreground">Allow team members to join this group.</div>
              </div>
              <Switch checked={isShared} onCheckedChange={setIsShared} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => setCreateGroupModalOpen(false)} className="rounded-xl px-6 border border-white/5 hover:bg-white/5">
            Cancel
          </Button>
          <Button onClick={handleCreate} className="rounded-xl px-8 font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
