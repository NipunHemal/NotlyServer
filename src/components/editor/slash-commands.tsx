"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
  useLayoutEffect,
} from 'react';
import { ReactRenderer } from '@tiptap/react';
import { Editor, Range, Extension } from '@tiptap/core';
import Suggestion, { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  Code2,
  Quote,
  Minus,
  LucideIcon,
} from 'lucide-react';

interface CommandItem {
  title: string;
  description: string;
  icon: LucideIcon;
  command: (props: { editor: Editor; range: Range }) => void;
}

const SLASH_COMMANDS: CommandItem[] = [
  {
    title: 'Text',
    description: 'Plain paragraph text',
    icon: Type,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered bullet list',
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered numbered list',
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Task List',
    description: 'Checkboxes for to-do items',
    icon: CheckSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Formatted code snippet',
    icon: Code2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Blockquote',
    description: 'Highlighted quote section',
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal line separator',
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

// --- Command List Component ---

interface CommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const CommandList = forwardRef<CommandListRef, SuggestionProps<CommandItem>>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    },
    [props]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const el = container.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (props.items.length === 0) {
    return (
      <div className="slash-menu-empty">
        No results
      </div>
    );
  }

  return (
    <div ref={containerRef} className="slash-menu">
      {props.items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            className={`slash-menu-item ${index === selectedIndex ? 'is-selected' : ''}`}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="slash-menu-item-icon">
              <Icon size={18} />
            </div>
            <div className="slash-menu-item-text">
              <span className="slash-menu-item-title">{item.title}</span>
              <span className="slash-menu-item-description">{item.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

CommandList.displayName = 'CommandList';

// --- Suggestion rendering via DOM portal (no tippy dependency) ---

const renderSuggestion = (): Omit<SuggestionOptions<CommandItem>['render'], never> => {
  let component: ReactRenderer | null = null;
  let popup: HTMLElement | null = null;

  return {
    onStart: (props: SuggestionProps<CommandItem>) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      popup = document.createElement('div');
      popup.style.position = 'absolute';
      popup.style.zIndex = '50';
      popup.appendChild(component.element as Node);
      document.body.appendChild(popup);

      updatePosition(popup, props);
    },

    onUpdate(props: SuggestionProps<CommandItem>) {
      component?.updateProps(props);
      if (popup) updatePosition(popup, props);
    },

    onKeyDown(props: SuggestionKeyDownProps) {
      if (props.event.key === 'Escape') {
        cleanup();
        return true;
      }
      return (component?.ref as CommandListRef)?.onKeyDown(props) ?? false;
    },

    onExit() {
      cleanup();
    },
  };

  function updatePosition(el: HTMLElement, props: SuggestionProps<CommandItem>) {
    const rect = props.clientRect?.();
    if (!rect) return;
    el.style.left = `${rect.left + window.scrollX}px`;
    el.style.top = `${rect.bottom + window.scrollY + 8}px`;
  }

  function cleanup() {
    popup?.remove();
    popup = null;
    component?.destroy();
    component = null;
  }
};

// --- Extension ---

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: CommandItem }) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) => {
          return SLASH_COMMANDS.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: renderSuggestion,
      } as SuggestionOptions<CommandItem>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
