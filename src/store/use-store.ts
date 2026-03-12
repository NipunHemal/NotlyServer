
import { create } from 'zustand';

export type FileType = 'system_doc' | 'pdf' | 'text' | 'excel' | 'doc' | 'image' | 'file';

export interface DocVersion {
  id: string;
  label: string;
  timestamp: string;
  author: string;
  content: string;
  wordCount: number;
}

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
  fileType: FileType;
  fileSize?: string;
  url?: string;
  versions?: DocVersion[];
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
  type: 'edit' | 'share' | 'version' | 'restore' | 'access' | 'create' | 'upload' | 'delete';
  description: string;
  timestamp: string;
  user: string;
  docRef?: string;
  dateGroup?: string; // e.g., 'Today', 'Yesterday'
}

interface AppState {
  notes: Note[];
  groups: Group[];
  activities: Activity[];
  selectedNoteId: string | null;
  sidebarOpen: boolean;
  searchOpen: boolean;
  
  // UI States
  isCreateNoteModalOpen: boolean;
  isCreateGroupModalOpen: boolean;
  isUploadModalOpen: boolean;
  
  // Actions
  addNote: (note: Partial<Note>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addGroup: (group: Omit<Group, 'id' | 'noteCount' | 'lastModified'>) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSelectedNote: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCreateNoteModalOpen: (open: boolean) => void;
  setCreateGroupModalOpen: (open: boolean) => void;
  setUploadModalOpen: (open: boolean) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'user'>) => void;
  createVersion: (noteId: string, label: string) => void;
  restoreVersion: (noteId: string, versionId: string) => void;
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
    groupId: 'g1-1',
    fileType: 'system_doc',
    versions: [
      { id: 'v1', label: 'Initial Draft', timestamp: '3 hours ago', author: 'Alex Rivers', content: 'Initial project setup...', wordCount: 120 }
    ]
  },
  {
    id: 'f1',
    title: 'Financial_Report_Q3.pdf',
    content: '',
    tags: ['Finance', 'Q3'],
    category: 'Work',
    lastEdited: '3 hours ago',
    author: 'Alex Rivers',
    isFavorite: false,
    isLocked: false,
    hasAI: false,
    fileType: 'pdf',
    fileSize: '2.4 MB',
    url: '#'
  },
  {
    id: 'f2',
    title: 'Product_Mockups.png',
    content: '',
    tags: ['Design', 'UI'],
    category: 'Research',
    lastEdited: 'Yesterday',
    author: 'Alex Rivers',
    isFavorite: true,
    isLocked: false,
    hasAI: false,
    fileType: 'image',
    fileSize: '1.1 MB',
    url: 'https://picsum.photos/seed/mockup/800/600'
  }
];

const initialGroups: Group[] = [
  { id: 'g1', name: 'Work Projects', description: 'Core business strategies and research.', noteCount: 12, lastModified: '1 hour ago', isShared: true, collaborators: [{ id: 'u1', name: 'Alex Rivers', avatar: 'https://picsum.photos/seed/u1/100/100', role: 'Owner' }] },
  { id: 'g1-1', name: 'Project Phoenix', description: 'Next-gen platform development.', parentId: 'g1', noteCount: 4, lastModified: '30 mins ago' },
  { id: 'g2', name: 'Personal Life', description: 'Journal, habits, and fitness.', noteCount: 8, lastModified: '2 days ago', isLocked: true },
];

const initialActivities: Activity[] = [
  { id: 'a1', type: 'edit', description: 'Updated Project Phoenix Roadmap', timestamp: '5 mins ago', user: 'Alex Rivers', docRef: '1', dateGroup: 'Today' },
  { id: 'a2', type: 'upload', description: 'Uploaded Financial_Report_Q3.pdf', timestamp: '3 hours ago', user: 'Alex Rivers', docRef: 'f1', dateGroup: 'Today' },
  { id: 'a3', type: 'version', description: 'Created a new version of Project Phoenix Roadmap', timestamp: 'Yesterday', user: 'Alex Rivers', docRef: '1', dateGroup: 'Yesterday' }
];

export const useStore = create<AppState>((set) => ({
  notes: initialNotes,
  groups: initialGroups,
  activities: initialActivities,
  selectedNoteId: null,
  sidebarOpen: true,
  searchOpen: false,
  isCreateNoteModalOpen: false,
  isCreateGroupModalOpen: false,
  isUploadModalOpen: false,

  addActivity: (activity) => set((state) => ({
    activities: [
      {
        ...activity,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: 'Just now',
        user: 'Alex Rivers',
        dateGroup: 'Today'
      },
      ...state.activities
    ]
  })),

  addNote: (note) => set((state) => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: note.title || 'Untitled',
      content: note.content || '',
      tags: note.tags || [],
      category: note.category || 'Work',
      lastEdited: 'Just now',
      author: 'Alex Rivers',
      isFavorite: false,
      isLocked: false,
      hasAI: false,
      fileType: note.fileType || 'system_doc',
      ...note
    };
    
    return { 
      notes: [newNote, ...state.notes],
      activities: [
        { id: Math.random().toString(36).substr(2, 9), type: 'create', description: `Created: ${newNote.title}`, timestamp: 'Just now', user: 'Alex Rivers', docRef: newNote.id, dateGroup: 'Today' },
        ...state.activities
      ]
    };
  }),

  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, ...updates } : n)
  })),

  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id)
  })),

  addGroup: (group) => set((state) => {
    const newGroup: Group = {
      ...group,
      id: Math.random().toString(36).substr(2, 9),
      noteCount: 0,
      lastModified: 'Just now',
    };
    return { 
      groups: [...state.groups, newGroup],
      activities: [{ id: Math.random().toString(36).substr(2, 9), type: 'create', description: `Created group: ${group.name}`, timestamp: 'Just now', user: 'Alex Rivers', dateGroup: 'Today' }, ...state.activities]
    };
  }),

  updateGroup: (id, updates) => set((state) => ({
    groups: state.groups.map((g) => g.id === id ? { ...g, ...updates } : g)
  })),

  deleteGroup: (id) => set((state) => ({
    groups: state.groups.filter((g) => g.id !== id)
  })),

  toggleFavorite: (id) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n)
  })),

  createVersion: (noteId, label) => set((state) => {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return state;

    const newVersion: DocVersion = {
      id: Math.random().toString(36).substr(2, 9),
      label,
      timestamp: 'Just now',
      author: 'Alex Rivers',
      content: note.content,
      wordCount: note.content.split(/\s+/).length
    };

    return {
      notes: state.notes.map(n => n.id === noteId ? { ...n, versions: [newVersion, ...(n.versions || [])] } : n),
      activities: [{ id: Math.random().toString(36).substr(2, 9), type: 'version', description: `Created version ${label} for ${note.title}`, timestamp: 'Just now', user: 'Alex Rivers', docRef: noteId, dateGroup: 'Today' }, ...state.activities]
    };
  }),

  restoreVersion: (noteId, versionId) => set((state) => {
    const note = state.notes.find(n => n.id === noteId);
    const version = note?.versions?.find(v => v.id === versionId);
    if (!note || !version) return state;

    return {
      notes: state.notes.map(n => n.id === noteId ? { ...n, content: version.content, lastEdited: 'Just now' } : n),
      activities: [{ id: Math.random().toString(36).substr(2, 9), type: 'restore', description: `Restored version ${version.label} for ${note.title}`, timestamp: 'Just now', user: 'Alex Rivers', docRef: noteId, dateGroup: 'Today' }, ...state.activities]
    };
  }),

  setSelectedNote: (id) => set({ selectedNoteId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setCreateNoteModalOpen: (open) => set({ isCreateNoteModalOpen: open }),
  setCreateGroupModalOpen: (open) => set({ isCreateGroupModalOpen: open }),
  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),
}));
