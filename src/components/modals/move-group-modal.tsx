
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/use-store';
import { useMoveGroup, useGroupTree, useGroupById } from '@/service/query/useGroup';
import { Loader2, Folder, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MoveGroupModal() {
  const { moveGroupId, setMoveGroup, selectedWorkspaceId } = useStore();
  const { data: group } = useGroupById(moveGroupId || '');
  const { data: tree } = useGroupTree(selectedWorkspaceId || '');
  const moveMutation = useMoveGroup();
  
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const handleMove = () => {
    if (!moveGroupId) return;
    moveMutation.mutate(
      { id: moveGroupId, target_parent_id: selectedParentId },
      {
        onSuccess: () => setMoveGroup(null),
      }
    );
  };

  const renderTree = (nodes: any[], level = 0) => {
    return nodes.map((node) => {
      // Don't show the group itself or its descendants as move targets
      if (node.id === moveGroupId) return null;
      
      return (
        <div key={node.id}>
          <button
            onClick={() => setSelectedParentId(node.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
              selectedParentId === node.id 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "hover:bg-white/5 border border-transparent"
            )}
            style={{ marginLeft: `${level * 1.5}rem` }}
          >
            <Folder className="w-4 h-4 opacity-60" />
            {node.name}
          </button>
          {node.children && node.children.length > 0 && renderTree(node.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <Dialog open={!!moveGroupId} onOpenChange={(open) => !open && setMoveGroup(null)}>
      <DialogContent className="glass-panel border-white/10 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Relocate Asset</DialogTitle>
          <p className="text-muted-foreground text-xs font-medium">Select new parent directory for <span className="text-primary font-bold">{group?.name}</span></p>
        </DialogHeader>
        
        <div className="py-6">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedParentId(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                  selectedParentId === null 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <Home className="w-4 h-4 opacity-60" />
                Root Directory
              </button>
              
              {tree && renderTree(tree)}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => setMoveGroup(null)} className="rounded-xl h-12 px-6">Cancel</Button>
          <Button 
            onClick={handleMove} 
            disabled={moveMutation.isPending || selectedParentId === group?.parent_id}
            className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
          >
            {moveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Execute Migration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
