
"use client";

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { useStore } from '@/store/use-store';
import { 
  Bold, Italic, List, ListOrdered, CheckSquare, 
  Code, Quote, Link as LinkIcon, Sparkles, 
  ChevronDown, Type, Heading1, Heading2, Heading3, 
  Table as TableIcon, Image as ImageIcon, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TiptapEditorProps {
  content: string;
  onUpdate: (content: string) => void;
}

export function TiptapEditor({ content, onUpdate }: TiptapEditorProps) {
  const { setSaving } = useStore();
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'bg-muted p-4 rounded-lg font-mono text-sm my-4' } },
      }),
      Placeholder.configure({
        placeholder: 'Press "/" for commands...',
      }),
      CharacterCount,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline cursor-pointer' } }),
      Highlight.configure({ HTMLAttributes: { class: 'bg-yellow-500/20 px-0.5 rounded' } }),
      Image,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setSaving(true);
      const html = editor.getHTML();
      onUpdate(html);
      
      // Slash command logic
      const { selection } = editor.state;
      const textBefore = editor.state.doc.textBetween(Math.max(0, selection.from - 1), selection.from);
      
      if (textBefore === '/') {
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashPos({ top: coords.bottom + window.scrollY, left: coords.left + window.scrollX });
        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
      }

      setTimeout(() => setSaving(false), 800);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] pb-40 text-lg leading-relaxed',
      },
    },
  });

  const runCommand = (command: () => void) => {
    command();
    setShowSlashMenu(false);
  };

  const slashCommands = [
    { label: 'Text', icon: Type, description: 'Start writing with plain text.', cmd: () => editor?.chain().focus().setParagraph().run() },
    { label: 'Heading 1', icon: Heading1, description: 'Big section heading.', cmd: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', icon: Heading2, description: 'Medium section heading.', cmd: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', icon: Heading3, description: 'Small section heading.', cmd: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Checklist', icon: CheckSquare, description: 'Track tasks with a todo list.', cmd: () => editor?.chain().focus().toggleTaskList().run() },
    { label: 'Bullet List', icon: List, description: 'Create a simple bulleted list.', cmd: () => editor?.chain().focus().toggleBulletList().run() },
    { label: 'Numbered List', icon: ListOrdered, description: 'Create a list with numbering.', cmd: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', icon: Quote, description: 'Capture a quotation.', cmd: () => editor?.chain().focus().toggleBlockquote().run() },
    { label: 'Divider', icon: Minus, description: 'Visually divide sections.', cmd: () => editor?.chain().focus().setHorizontalRule().run() },
    { label: 'AI Generate', icon: Sparkles, description: 'Use AI to generate content.', cmd: () => {}, ai: true },
  ];

  if (!editor) return null;

  return (
    <div className="relative w-full">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-1 p-1 rounded-xl glass-panel shadow-2xl border-white/20">
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-8 h-8 rounded-lg", editor.isActive('bold') && 'bg-primary/20 text-primary')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-8 h-8 rounded-lg", editor.isActive('italic') && 'bg-primary/20 text-primary')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-8 h-8 rounded-lg", editor.isActive('link') && 'bg-primary/20 text-primary')}
              onClick={() => {
                const url = window.prompt('Enter URL');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button
              variant="ghost"
              className="h-8 px-2 text-[10px] font-bold text-ai gap-1.5 hover:text-ai hover:bg-ai/10"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Ask
            </Button>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />

      <AnimatePresence>
        {showSlashMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{ position: 'absolute', top: slashPos.top - 120, left: slashPos.left, zIndex: 100 }}
            className="w-72 max-h-96 overflow-y-auto glass-panel border-white/20 rounded-2xl shadow-2xl p-2 custom-scrollbar"
          >
            <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Basic Blocks</div>
            <div className="space-y-1">
              {slashCommands.map((item, i) => (
                <button
                  key={i}
                  onClick={() => runCommand(item.cmd)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors",
                    item.ai ? "hover:bg-ai/10 group/ai" : "hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border border-white/5",
                    item.ai ? "bg-ai/10 text-ai" : "bg-white/[0.03] text-muted-foreground"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-xs font-bold", item.ai ? "text-ai" : "text-white")}>{item.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
