
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateNote } from '@/service/query/useNote';
import { useStore } from '@/store/use-store';
import { Loader2, Layout, ChevronRight, FileText, Sparkles, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGroupTree } from '@/service/query/useGroup';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewNotePage() {
  const router = useRouter();
  const { selectedWorkspaceId } = useStore();
  const { data: tree, isLoading: treeLoading } = useGroupTree(selectedWorkspaceId || '');
  const createNoteMutation = useCreateNote();
  const { toast } = useToast();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleCreate = (groupId: string | null) => {
    if (!selectedWorkspaceId) return;

    setIsDeploying(true);
    setSelectedGroupId(groupId);

    createNoteMutation.mutate({
      title: 'Untitled Intel',
      group_id: groupId,
      // content: 'Start writing your intelligence report...'
    }, {
      onSuccess: (data) => {
        router.replace(`/notes/${data.id}`);
      },
      onError: (error: any) => {
        setIsDeploying(false);
        toast({
          variant: 'destructive',
          title: 'Deployment Failed',
          description: error.response?.data?.message || 'Could not initialize intelligence unit.',
        });
      }
    });
  };

  if (isDeploying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-10">
        <div className="max-w-md w-full space-y-12 text-center">
          <div className="relative mx-auto w-32 h-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-[2.5rem] border-t-4 border-primary shadow-[0_0_50px_-10px_rgba(var(--primary),0.5)]"
            />
            <div className="absolute inset-4 rounded-[1.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Deploying Unit</h2>
            <div className="flex flex-col items-center gap-1">
              <p className="text-muted-foreground font-black text-[10px] tracking-[0.3em] uppercase">Target Sector: {selectedGroupId ? 'Encrypted Group' : 'Global Workspace'}</p>
              <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-10 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full space-y-12">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <Box className="w-3 h-3" /> Initialization Sequence
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white">Choose Deployment Sector</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Select where this intelligence unit should be initialized. You can move it later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Root Workspace Option */}
          <button
            onClick={() => handleCreate(null)}
            className="group relative p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-primary/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
              <Layout className="w-32 h-32 rotate-12" />
            </div>
            <div className="relative space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Layout className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">Global Workspace</h3>
                <p className="text-muted-foreground text-sm font-medium">Deploy to the root level of your current workspace.</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pt-4">
                Initialize Here <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </button>

          {/* Group Options Container */}
          <div className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 flex flex-col">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground">Intelligence Groups</h3>
            </div>
            <div className="flex-1 max-h-[300px] overflow-y-auto p-4 space-y-2 scrollbar-hide">
              {treeLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-primary/20" />
                </div>
              ) : tree && tree.length > 0 ? (
                tree.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleCreate(group.id)}
                    className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20">
                        <Box className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-bold text-white group-hover:text-primary transition-colors">{group.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
                    <Layout className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">No sectors found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-full px-8 text-muted-foreground hover:text-white hover:bg-white/5 font-bold"
          >
            Abort Sequence
          </Button>
        </div>
      </div>
    </div>
  );
}
