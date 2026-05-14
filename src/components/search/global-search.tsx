
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, 
  CommandItem, CommandList, CommandSeparator, CommandShortcut 
} from '@/components/ui/command';
import { useStore, Note, Group } from '@/store/use-store';
import { 
  Search, FileText, Folder, Tag, User, History, 
  Sparkles, File as FileIcon, ImageIcon, Settings, 
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export function GlobalSearch() {
  const { searchOpen, setSearchOpen, notes, groups, setSelectedNote } = useStore();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [searchOpen]);

  const onSelectNote = (note: Note) => {
    setSelectedNote(note.id);
    setSearchOpen(false);
    router.push('/docs');
  };

  const onSelectGroup = (group: Group) => {
    setSearchOpen(false);
    router.push(`/groups/${group.id}`);
  };

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <div className="p-4 border-b border-white/5 bg-background">
        <div className="flex items-center gap-2 text-muted-foreground mb-4 px-2">
          <Search className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Global Intelligence Search</span>
        </div>
        <CommandInput placeholder="Search documents, groups, tags, metadata..." className="border-none focus:ring-0 text-lg h-12" />
      </div>
      
      <CommandList className="max-h-[450px] overflow-y-auto custom-scrollbar p-2">
        <CommandEmpty className="py-12 text-center">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 w-fit mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground/20" />
          </div>
          <p className="text-sm text-muted-foreground">No matches found in your knowledge base.</p>
        </CommandEmpty>

        <CommandGroup heading="System Documents">
          {notes.filter(n => n.fileType === 'system_doc' && !n.isDeleted).map(note => (
            <CommandItem 
              key={note.id} 
              onSelect={() => onSelectNote(note)}
              className="flex items-center gap-4 p-3 rounded-xl cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{note.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground truncate italic">{note.content.substring(0, 60)}...</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase">{note.category}</Badge>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="bg-white/5 my-2" />

        <CommandGroup heading="External Files">
          {notes.filter(n => n.fileType !== 'system_doc' && !n.isDeleted).map(note => (
            <CommandItem 
              key={note.id} 
              onSelect={() => onSelectNote(note)}
              className="flex items-center gap-4 p-3 rounded-xl cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-muted-foreground group-hover:border-primary/50 transition-all">
                {note.fileType === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{note.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{note.fileType}</span>
                  <span className="text-[10px] text-muted-foreground/40">{note.fileSize}</span>
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="bg-white/5 my-2" />

        <CommandGroup heading="Hierarchical Groups">
          {groups.map(group => (
            <CommandItem 
              key={group.id} 
              onSelect={() => onSelectGroup(group)}
              className="flex items-center gap-4 p-3 rounded-xl cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                <Folder className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{group.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{group.description}</p>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">{group.noteCount} items</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="bg-white/5 my-2" />

        <CommandGroup heading="Global Commands">
          <CommandItem className="gap-4 p-3 rounded-xl cursor-pointer">
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold">New Document</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem className="gap-4 p-3 rounded-xl cursor-pointer">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold">Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      
      <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-6">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><kbd className="bg-white/[0.05] px-1 rounded border border-white/10">↵</kbd> Select</span>
          <span className="flex items-center gap-1.5"><kbd className="bg-white/[0.05] px-1 rounded border border-white/10">↑↓</kbd> Navigate</span>
        </div>
        <span className="flex items-center gap-1.5"><kbd className="bg-white/[0.05] px-1 rounded border border-white/10">ESC</kbd> Close</span>
      </div>
    </CommandDialog>
  );
}
