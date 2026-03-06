
import { create } from 'zustand';

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category: string;
  lastEdited: string;
  author: string;
  isFavorite: boolean;
  isLocked: boolean;
  hasAI: boolean;
  groupId?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  noteCount: number;
  lastModified: string;
  parentId?: string;
  isLocked?: boolean;
  isShared?: boolean;
  collaborators?: { id: string; name: string; avatar: string; role: 'Owner' | 'Editor' | 'Viewer' }[];
}

export interface Activity {
  id: string;
  type: 'edit' | 'share' | 'version' | 'restore' | 'access';
  description: string;
  timestamp: string;
  user: string;
  docRef?: string;
}

interface AppState {
  notes: Note[];
  groups: Group[];
  activities: Activity[];
  selectedNoteId: string | null;
  sidebarOpen: boolean;
  
  // Actions
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addGroup: (group: Group) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSelectedNote: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
}

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Project Phoenix Roadmap',
    content: 'Phase 1: Research and development of core modules. Phase 2: User testing and feedback. Phase 3: Global launch.',
    tags: ['Strategy', '2024'],
    category: 'Work',
    lastEdited: '2 hours ago',
    author: 'Alex Rivers',
    isFavorite: true,
    isLocked: false,
    hasAI: true,
    groupId: 'g1-1'
  },
  {
    id: '2',
    title: 'Morning Meditation Rituals',
    content: 'Start with deep breathing for 5 minutes. Focus on gratitude. Spend 10 minutes in silence.',
    tags: ['Health', 'Mindfulness'],
    category: 'Personal',
    lastEdited: 'Yesterday',
    author: 'Alex Rivers',
    isFavorite: false,
    isLocked: true,
    hasAI: false,
    groupId: 'g2'
  },
  {
    id: '3',
    title: 'Cognito AI System Specs',
    content: 'Latency targets: < 200ms. Token usage optimization. Context window management.',
    tags: ['Engineering', 'AI'],
    category: 'Research',
    lastEdited: '5 mins ago',
    author: 'Alex Rivers',
    isFavorite: true,
    isLocked: false,
    hasAI: true,
    groupId: 'g1-1'
  }
];

const initialGroups: Group[] = [
  { id: 'g1', name: 'Work Projects', description: 'Core business strategies and research.', noteCount: 12, lastModified: '1 hour ago', isShared: true, collaborators: [{ id: 'u1', name: 'Alex Rivers', avatar: 'https://picsum.photos/seed/u1/100/100', role: 'Owner' }] },
  { id: 'g1-1', name: 'Project Phoenix', description: 'Next-gen platform development.', parentId: 'g1', noteCount: 4, lastModified: '30 mins ago' },
  { id: 'g1-2', name: 'Market Research', description: 'Competitor analysis and trends.', parentId: 'g1', noteCount: 8, lastModified: '2 hours ago' },
  { id: 'g2', name: 'Personal Life', description: 'Journal, habits, and fitness.', noteCount: 8, lastModified: '2 days ago', isLocked: true },
  { id: 'g3', name: 'Random Ideas', description: 'Brainstorming sandbox.', noteCount: 24, lastModified: '5 mins ago' }
];

const initialActivities: Activity[] = [
  { id: 'a1', type: 'edit', description: 'Updated Cognitio AI System Specs', timestamp: '5 mins ago', user: 'Alex Rivers', docRef: '3' },
  { id: 'a2', type: 'version', description: 'Created a new version of Project Phoenix Roadmap', timestamp: '2 hours ago', user: 'Alex Rivers', docRef: '1' },
  { id: 'a3', type: 'share', description: 'Shared Morning Meditation Rituals with Sarah', timestamp: 'Yesterday', user: 'Alex Rivers', docRef: '2' }
];

export const useStore = create<AppState>((set) => ({
  notes: initialNotes,
  groups: initialGroups,
  activities: initialActivities,
  selectedNoteId: null,
  sidebarOpen: true,

  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, ...updates } : n)
  })),
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id)
  })),
  addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
  updateGroup: (id, updates) => set((state) => ({
    groups: state.groups.map((g) => g.id === id ? { ...g, ...updates } : g)
  })),
  deleteGroup: (id) => set((state) => ({
    groups: state.groups.filter((g) => g.id !== id)
  })),
  toggleFavorite: (id) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n)
  })),
  setSelectedNote: (id) => set({ selectedNoteId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
