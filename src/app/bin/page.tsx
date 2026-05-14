
"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useStore } from '@/store/use-store';
import { DocCard } from '@/components/documents/doc-card';
import { Trash2, Search, RotateCcw, Trash, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function BinPage() {
  const { notes, permanentDeleteNote, restoreFromBin } = useStore();
  const [search, setSearch] = useState('');

  const deletedNotes = notes.filter(n => 
    n.isDeleted && (
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    )
  );

  const emptyBin = () => {
    deletedNotes.forEach(note => permanentDeleteNote(note.id));
  };

  const restoreAll = () => {
    deletedNotes.forEach(note => restoreFromBin(note.id));
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Trash2 className="w-10 h-10 text-destructive" /> Recycle Bin
            </h1>
            <p className="text-muted-foreground">Documents here will be permanently deleted after 30 days.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in bin..." 
                className="bg-white/[0.03] border-white/10 pl-10 h-11 rounded-xl"
              />
            </div>
          </div>
        </header>

        {deletedNotes.length > 0 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
            <div className="flex items-center gap-3 text-sm text-destructive font-medium">
              <AlertCircle className="w-5 h-5" />
              <span>You have {deletedNotes.length} items in the bin.</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary hover:bg-primary/10 font-bold"
                onClick={restoreAll}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Restore All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
                onClick={emptyBin}
              >
                <Trash className="w-4 h-4 mr-2" /> Empty Bin
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {deletedNotes.length > 0 ? (
              deletedNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <DocCard note={note} />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 text-center opacity-50"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                  <Trash2 className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Your bin is empty</h3>
                  <p className="text-sm">Deleted documents will appear here.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
