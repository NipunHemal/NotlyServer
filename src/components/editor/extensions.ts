
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { SlashCommands } from './slash-commands';

export const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
      HTMLAttributes: {
        class: 'notion-heading',
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class: 'notion-code-block',
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: 'notion-bullet-list',
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: 'notion-ordered-list',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'notion-blockquote',
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: 'notion-divider',
      },
    },
    dropcursor: {
      color: 'hsl(var(--primary))',
      width: 2,
    },
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level;
        if (level === 1) return 'Heading 1';
        if (level === 2) return 'Heading 2';
        if (level === 3) return 'Heading 3';
      }
      return "Type '/' for commands…";
    },
    includeChildren: true,
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: 'notion-task-list',
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: 'notion-task-item',
    },
  }),
  Highlight.configure({
    multicolor: true,
    HTMLAttributes: {
      class: 'notion-highlight',
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'notion-link',
    },
  }),
  Underline,
  Typography,
  TextStyle,
  Color,
  CharacterCount,
  SlashCommands,
];
