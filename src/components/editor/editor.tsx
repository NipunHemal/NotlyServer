
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { EDITOR_EXTENSIONS } from './extensions';
import { useAutosave } from '@/hooks/use-autosave';
import { Note } from '@/service/functions/note.service';
import {
  Loader2,
  MoreHorizontal,
  Clock,
  Star,
  Check,
  History,
  Share2,
  Copy,
  Archive,
  Trash2,
  ArrowRightLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { VersionHistorySidebar } from './version-history-sidebar';
import { useToggleNoteFavorite, useArchiveNote, useDuplicateNote, useDeleteNote } from '@/service/query/useNote';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import './editor.css';

interface EditorProps {
  note: Note;
  onUpdate: (data: { title?: string; contentJson?: any }) => void;
  isSaving?: boolean;
}

export function NotionEditor({ note, onUpdate, isSaving }: EditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const toggleFavoriteMutation = useToggleNoteFavorite();
  const archiveMutation = useArchiveNote();
  const duplicateMutation = useDuplicateNote();
  const deleteMutation = useDeleteNote(note.group_id);

  // Parse content_json: backend sends it as a JSON string, Tiptap needs an object
  const parseContent = useCallback((raw: any): any => {
    if (!raw) return '';
    if (typeof raw === 'object') return raw; // already parsed
    try {
      return JSON.parse(raw);
    } catch {
      return raw; // fallback to raw string if parse fails
    }
  }, []);

  const debouncedContentSave = useAutosave({
    onSave: (contentJson: any) => {
      onUpdate({ contentJson: JSON.stringify(contentJson) });
    },
  });

  const debouncedTitleSave = useAutosave({
    onSave: (newTitle: string) => {
      onUpdate({ title: newTitle });
    },
  });

  const initialContent = parseContent(note.content_json) || note.content || '';

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[500px] px-1',
      },
    },
    onUpdate: ({ editor }) => {
      debouncedContentSave(editor.getJSON());
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedTitleSave(newTitle);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editor?.commands.focus('start');
    }
  };

  // Hydrate content if note changes (e.g. from version restore)
  useEffect(() => {
    const parsed = parseContent(note.content_json);
    if (editor && parsed && JSON.stringify(parsed) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(parsed);
    }
    setTitle(note.title);
  }, [note.id, editor, note.content_json, note.title, parseContent]);

  // Auto-resize title textarea
  const autoResizeTitle = useCallback((el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, []);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Just now' : formatDistanceToNow(date, { addSuffix: true });
  };

  if (!editor) return null;

  return (
    <>
      <div className="flex flex-col w-full max-w-3xl mx-auto py-16 px-6 notion-editor">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-12 sticky top-0 z-10 bg-background/80 backdrop-blur-xl py-3 -mx-6 px-6 border-b border-transparent">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
              isSaving
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            )}>
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  <span>Saved</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground/50 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(note.updated_at)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg hover:bg-accent"
              onClick={() => setIsHistoryOpen(true)}
              title="Version History"
            >
              <History className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg hover:bg-accent"
              onClick={() => toggleFavoriteMutation.mutate(note.id)}
              title="Toggle Favorite"
            >
              <Star className={cn("w-4 h-4", note.is_favorite && "fill-yellow-500 text-yellow-500")} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-accent">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-xl p-1.5" align="end">
                <DropdownMenuItem className="rounded-lg gap-2.5 cursor-pointer text-[13px]" onClick={() => duplicateMutation.mutate(note.id)}>
                  <Copy className="w-4 h-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg gap-2.5 cursor-pointer text-[13px]">
                  <ArrowRightLeft className="w-4 h-4" /> Move to…
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg gap-2.5 cursor-pointer text-[13px]">
                  <Share2 className="w-4 h-4" /> Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg gap-2.5 cursor-pointer text-[13px]" onClick={() => archiveMutation.mutate(note.id)}>
                  <Archive className="w-4 h-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg gap-2.5 cursor-pointer text-[13px] text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Move this note to bin?")) deleteMutation.mutate(note.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Move to Bin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <textarea
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          ref={(el) => autoResizeTitle(el)}
          placeholder="Untitled"
          rows={1}
          className="text-[42px] font-extrabold tracking-tight bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/20 w-full leading-tight mb-2 overflow-hidden"
        />

        {/* Meta */}
        <div className="flex items-center gap-3 mb-8 text-[12px] text-muted-foreground/40 font-medium">
          {note.owner_name && <span>{note.owner_name}</span>}
          {note.owner_name && <span>·</span>}
          <span>v{note.version_number}</span>
        </div>

        {/* Bubble Menu (appears on text selection) */}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 150, placement: 'top' }}
            className="bubble-menu"
          >
            <button
              className={cn('bubble-menu-button', editor.isActive('bold') && 'is-active')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Bold size={15} />
            </button>
            <button
              className={cn('bubble-menu-button', editor.isActive('italic') && 'is-active')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Italic size={15} />
            </button>
            <button
              className={cn('bubble-menu-button', editor.isActive('underline') && 'is-active')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <UnderlineIcon size={15} />
            </button>
            <button
              className={cn('bubble-menu-button', editor.isActive('strike') && 'is-active')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <Strikethrough size={15} />
            </button>
            <button
              className={cn('bubble-menu-button', editor.isActive('code') && 'is-active')}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Inline Code"
            >
              <Code size={15} />
            </button>
            <button
              className={cn('bubble-menu-button', editor.isActive('highlight') && 'is-active')}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              title="Highlight"
            >
              <Highlighter size={15} />
            </button>
          </BubbleMenu>
        )}

        {/* Editor */}
        <EditorContent editor={editor} />

        {/* Footer */}
        <div className="pt-24 mt-12 border-t border-border/10 flex items-center justify-between opacity-30 hover:opacity-70 transition-opacity duration-300">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Synced
            </span>
            <span>·</span>
            <span>{editor.storage.characterCount.characters()} chars</span>
            <span>·</span>
            <span>{editor.storage.characterCount.words()} words</span>
          </div>
        </div>
      </div>

      <VersionHistorySidebar
        noteId={note.id}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentVersionNumber={note.version_number}
      />
    </>
  );
}
