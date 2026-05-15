
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useNote, useAutosaveNote } from '@/service/query/useNote';
import { NotionEditor } from '@/components/editor/editor';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NoteDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: note, isLoading, error } = useNote(id);
  const autosaveMutation = useAutosaveNote();

  const handleUpdate = (data: { title?: string; contentJson?: any }) => {
    if (!note) return;

    autosaveMutation.mutate({
      id,
      data: {
        ...data,
        clientVersion: note.lock_version
      }
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Synchronizing Knowledge Base...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !note) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight">Intelligence Loss</h2>
              <p className="text-muted-foreground font-medium">The requested intelligence unit could not be located or has been extracted from the system.</p>
            </div>
            <Link href="/dashboard">
              <Button className="rounded-2xl h-12 px-8 font-bold bg-primary hover:bg-primary/90 mt-4">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideSidebar>
      <div className="min-h-screen bg-background">
        <NotionEditor
          note={note}
          onUpdate={handleUpdate}
          isSaving={autosaveMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
