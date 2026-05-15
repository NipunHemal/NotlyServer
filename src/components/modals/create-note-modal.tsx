
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/use-store';
import { useToast } from '@/hooks/use-toast';
import { FileText, Layout, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCreateNote } from '@/service/query/useNote';
import { useGroupTree } from '@/service/query/useGroup';

export function CreateNoteModal() {
  const { isCreateNoteModalOpen, setCreateNoteModalOpen, selectedWorkspaceId } = useStore();
  const { toast } = useToast();
  const router = useRouter();
  const createNoteMutation = useCreateNote();
  const { data: tree } = useGroupTree(selectedWorkspaceId || '');
  
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState<string>('none');

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    if (!selectedWorkspaceId) {
      toast({ title: "Workspace required", variant: "destructive" });
      return;
    }

    createNoteMutation.mutate({
      title,
      group_id: groupId === 'none' ? null : groupId,
      content: 'Start writing your intelligence report...'
    }, {
      onSuccess: (data) => {
        toast({ title: "Document Created", description: "Opening editor..." });
        setTitle('');
        setGroupId('none');
        setCreateNoteModalOpen(false);
        router.push(`/notes/${data.id}`);
      }
    });
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
              disabled={createNoteMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Layout className="w-3 h-3" /> Group
            </Label>
            <Select value={groupId} onValueChange={setGroupId} disabled={createNoteMutation.isPending}>
              <SelectTrigger className="bg-white/[0.03] border-white/10 h-12 rounded-xl">
                <SelectValue placeholder="Root level" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-white/10">
                <SelectItem value="none">Root level (No group)</SelectItem>
                {tree?.map((g: any) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setCreateNoteModalOpen(false)} 
            className="rounded-2xl px-8 h-12 border border-white/5 hover:bg-white/5 font-bold"
            disabled={createNoteMutation.isPending}
          >
            Discard
          </Button>
          <Button 
            onClick={handleCreate} 
            className="rounded-2xl px-10 h-12 font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 min-w-[180px]"
            disabled={createNoteMutation.isPending}
          >
            {createNoteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Initializing...
              </>
            ) : (
              'Create & Open Editor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
