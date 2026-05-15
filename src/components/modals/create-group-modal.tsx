
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/use-store';
import { FolderPlus, Layers, Lock, Globe, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useCreateGroup, useGroupTree } from '@/service/query/useGroup';

export function CreateGroupModal() {
  const { isCreateGroupModalOpen, setCreateGroupModalOpen, user } = useStore();
  const createGroupMutation = useCreateGroup();
  const { data: groupTree } = useGroupTree(user?.id); // In actual app, workspace_id might be different
  
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isSecure, setIsSecure] = useState(false);
  const [password, setPassword] = useState('');

  const handleCreate = () => {
    createGroupMutation.mutate({
      name,
      parent_id: parentId === 'none' || !parentId ? null : parentId,
      is_secure: isSecure,
      password: isSecure ? password : null,
    }, {
      onSuccess: () => {
        // Reset and close
        setName('');
        setParentId('');
        setIsSecure(false);
        setPassword('');
        setCreateGroupModalOpen(false);
      }
    });
  };

  // Flatten group tree for selection
  const flattenGroups = (nodes: any[] = [], depth = 0): any[] => {
    return nodes.reduce((acc, node) => {
      acc.push({ ...node, depth });
      if (node.children) {
        acc.push(...flattenGroups(node.children, depth + 1));
      }
      return acc;
    }, []);
  };

  const flatGroups = flattenGroups(groupTree || []);

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
              className="bg-white/[0.03] border-white/10 h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Layers className="w-3 h-3" /> Nest Under (Optional)
            </Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger className="bg-white/[0.03] border-white/10 h-11 rounded-xl">
                <SelectValue placeholder="Root Level" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-white/10 bg-popover/90 backdrop-blur-xl">
                <SelectItem value="none">Root Level (No Parent)</SelectItem>
                {flatGroups.map(g => (
                  <SelectItem key={g.id} value={g.id} className="cursor-pointer">
                    {'\u00A0'.repeat(g.depth * 4)} {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Secure Vault Group
                </div>
                <div className="text-xs text-muted-foreground">Encrypt contents and require a password.</div>
              </div>
              <Switch checked={isSecure} onCheckedChange={setIsSecure} />
            </div>

            {isSecure && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="pass" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vault Password</Label>
                <Input 
                  id="pass" 
                  type="password"
                  placeholder="Min 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/[0.03] border-white/10 h-11 rounded-xl"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button 
            variant="ghost" 
            onClick={() => setCreateGroupModalOpen(false)} 
            className="rounded-xl px-6 border border-white/5 hover:bg-white/5"
            disabled={createGroupMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            className="rounded-xl px-8 font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
            disabled={createGroupMutation.isPending || !name.trim() || (isSecure && password.length < 6)}
          >
            {createGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
