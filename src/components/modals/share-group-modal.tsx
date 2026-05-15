
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/use-store';
import { useShareGroup, useCollaborators, useGroupById } from '@/service/query/useGroup';
import { Loader2, Mail, Shield, UserPlus, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function ShareGroupModal() {
  const { shareGroupId, setShareGroup } = useStore();
  const { data: group } = useGroupById(shareGroupId || '');
  const { data: collaborators } = useCollaborators(shareGroupId || '');
  const shareMutation = useShareGroup();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');

  const handleShare = () => {
    if (!shareGroupId || !email.trim()) return;
    shareMutation.mutate(
      { id: shareGroupId, email, role },
      {
        onSuccess: () => setEmail(''),
      }
    );
  };

  return (
    <Dialog open={!!shareGroupId} onOpenChange={(open) => !open && setShareGroup(null)}>
      <DialogContent className="glass-panel border-white/10 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Collaboration Access</DialogTitle>
          <p className="text-muted-foreground text-xs font-medium">Manage operational access for <span className="text-primary font-bold">{group?.name}</span></p>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Agent Identifier (Email)</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-panel border-white/5 bg-white/[0.02] h-12 rounded-xl pl-11 focus:ring-primary/20"
                  placeholder="agent@agency.com"
                />
              </div>
            </div>
            <div className="w-32 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Protocol</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="glass-panel border-white/5 bg-white/[0.02] h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/10">
                  <SelectItem value="VIEWER">VIEWER</SelectItem>
                  <SelectItem value="EDITOR">EDITOR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleShare} 
              disabled={shareMutation.isPending || !email.trim()}
              className="mt-6 h-12 rounded-xl px-4"
            >
              {shareMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            </Button>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Active Clearances
            </h4>
            
            <ScrollArea className="h-[200px] -mx-1 px-1">
              <div className="space-y-2">
                {collaborators?.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 border border-white/10">
                        <AvatarImage src={collab.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.user.username}`} />
                        <AvatarFallback>{collab.user.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{collab.user.displayName}</span>
                        <span className="text-[10px] text-muted-foreground/60">{collab.user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase tracking-widest border-white/5",
                        collab.role === 'EDITOR' ? "text-primary bg-primary/5" : "text-muted-foreground/60 bg-white/5"
                      )}>
                        {collab.role}
                      </Badge>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setShareGroup(null)} className="rounded-xl h-12 px-6 w-full">Close Protocol</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
