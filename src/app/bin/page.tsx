
"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Trash2, Search, RotateCcw, Trash, AlertCircle, FileText, Folder, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useBinItems, useRestoreBinItem, usePermanentDeleteBinItem, useEmptyBin } from '@/service/query/useBin';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function BinPage() {
  const [search, setSearch] = useState('');
  const { data: binItems, isLoading } = useBinItems();
  const restoreMutation = useRestoreBinItem();
  const deleteMutation = usePermanentDeleteBinItem();
  const emptyBinMutation = useEmptyBin();

  const filteredItems = binItems?.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleEmptyBin = () => {
    if (confirm("Are you sure you want to permanently delete ALL items in the bin? This action cannot be undone.")) {
      emptyBinMutation.mutate();
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-12 py-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shadow-lg shadow-destructive/5">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Recycle Bin</h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Items are permanently deleted after 30 days
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search deleted assets..." 
                className="w-72 pl-11 h-12 glass-panel border-white/5 bg-white/[0.02] rounded-xl focus:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="h-12 px-6 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 gap-2 font-bold"
              onClick={handleEmptyBin}
              disabled={filteredItems.length === 0 || emptyBinMutation.isPending}
            >
              <Trash className="w-4 h-4" />
              Empty Bin
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">Decrypting Bin Data...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel group p-5 flex items-center justify-between rounded-[1.5rem] border-white/5 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                      item.entity_type === 'GROUP' 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500 group-hover:scale-110" 
                        : "bg-primary/10 border-primary/20 text-primary group-hover:scale-110"
                    )}>
                      {item.entity_type === 'GROUP' ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.15em] border-white/5 bg-white/[0.03]">
                          {item.entity_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          Deleted {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className={cn(
                          "flex items-center gap-1.5",
                          item.days_left < 7 ? "text-destructive" : "text-emerald-500/80"
                        )}>
                          <RotateCcw className="w-3.5 h-3.5" />
                          {item.days_left} days remaining
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-10 rounded-xl px-4 gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold"
                      onClick={() => restoreMutation.mutate(item.id)}
                      disabled={restoreMutation.isPending}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-10 rounded-xl px-4 gap-2 text-destructive hover:bg-destructive/10 font-bold"
                      onClick={() => {
                        if (confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="w-4 h-4" />
                      Wipe
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white/[0.02] border border-dashed border-white/5 flex items-center justify-center animate-pulse" />
              <Trash2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-muted-foreground/20" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black uppercase tracking-widest text-muted-foreground/40">Bin Clear</h3>
              <p className="text-sm text-muted-foreground/60 max-w-xs font-medium">No intelligence assets currently flagged for extraction.</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
