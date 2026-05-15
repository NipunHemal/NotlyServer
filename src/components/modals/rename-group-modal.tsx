
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/use-store';
import { useRenameGroup, useGroupById } from '@/service/query/useGroup';
import { Loader2 } from 'lucide-react';

export function RenameGroupModal() {
  const { renameGroupId, setRenameGroup } = useStore();
  const { data: group } = useGroupById(renameGroupId || '');
  const renameMutation = useRenameGroup();
  const [name, setName] = useState('');

  useEffect(() => {
    if (group) {
      setName(group.name);
    }
  }, [group]);

  const handleRename = () => {
    if (!renameGroupId || !name.trim()) return;
    renameMutation.mutate(
      { id: renameGroupId, name },
      {
        onSuccess: () => setRenameGroup(null),
      }
    );
  };

  return (
    <Dialog open={!!renameGroupId} onOpenChange={(open) => !open && setRenameGroup(null)}>
      <DialogContent className="glass-panel border-white/10 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Rename Intelligence Unit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">New Designation</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-panel border-white/5 bg-white/[0.02] h-12 rounded-xl focus:ring-primary/20"
              placeholder="e.g. Project Overlord"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => setRenameGroup(null)} className="rounded-xl h-12 px-6">Cancel</Button>
          <Button 
            onClick={handleRename} 
            disabled={renameMutation.isPending || !name.trim() || name === group?.name}
            className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
          >
            {renameMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Update Protocol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
