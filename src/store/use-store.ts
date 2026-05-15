import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

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
  isDeleted?: boolean;
  deletedAt?: string;
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

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  displayName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
}

export interface Activity {
  id: string;
  type: 'edit' | 'share' | 'version' | 'restore' | 'access' | 'create' | 'upload' | 'delete';
  description: string;
  timestamp: string;
  user: string;
  docRef?: string;
  dateGroup?: string;
}

interface AppState {
  notes: Note[];
  groups: Group[];
  activities: Activity[];
  selectedNoteId: string | null;
  sidebarOpen: boolean;
  searchOpen: boolean;
  isSaving: boolean;
  
  // Auth State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // UI States
  isCreateNoteModalOpen: boolean;
  isCreateGroupModalOpen: boolean;
  createGroupParentId: string | null;
  isUploadModalOpen: boolean;
  
  // Group Action Modals
  shareGroupId: string | null;
  moveGroupId: string | null;
  lockGroupId: string | null;
  renameGroupId: string | null;
  
  // Workspace State
  workspaces: any[];
  selectedWorkspaceId: string | null;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  addNote: (note: Partial<Note>) => string;
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
  setCreateGroupModalOpen: (open: boolean, parentId?: string | null) => void;
  setCreateGroupParentId: (id: string | null) => void;
  setUploadModalOpen: (open: boolean) => void;
  setSaving: (saving: boolean) => void;
  setWorkspaces: (workspaces: any[]) => void;
  setSelectedWorkspaceId: (id: string | null) => void;
  setShareGroup: (id: string | null) => void;
  setMoveGroup: (id: string | null) => void;
  setLockGroup: (id: string | null) => void;
  setRenameGroup: (id: string | null) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'user'>) => void;
  createVersion: (noteId: string, label: string) => void;
  restoreVersion: (noteId: string, versionId: string) => void;
  moveToBin: (id: string) => void;
  restoreFromBin: (id: string) => void;
  permanentDeleteNote: (id: string) => void;
}

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Project Phoenix Roadmap',
    content: '<h1>Project Phoenix Roadmap</h1><p>Phase 1: Research and development of core modules.</p><p>Phase 2: User testing and feedback.</p><p>Phase 3: Global launch.</p>',
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
      { id: 'v1', label: 'Initial Draft', timestamp: '3 hours ago', author: 'Alex Rivers', content: '<p>Initial project setup...</p>', wordCount: 120 }
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
  }
];

const initialGroups: Group[] = [
  { id: 'g1', name: 'Work Projects', description: 'Core business strategies and research.', noteCount: 12, lastModified: '1 hour ago', isShared: true, collaborators: [{ id: 'u1', name: 'Alex Rivers', avatar: 'https://picsum.photos/seed/u1/100/100', role: 'Owner' }] },
  { id: 'g1-1', name: 'Project Phoenix', description: 'Next-gen platform development.', parentId: 'g1', noteCount: 4, lastModified: '30 mins ago' },
  { id: 'g2', name: 'Personal Life', description: 'Journal, habits, and fitness.', noteCount: 8, lastModified: '2 days ago', isLocked: true },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      notes: initialNotes,
      groups: initialGroups,
      activities: [],
      selectedNoteId: null,
      sidebarOpen: true,
      searchOpen: false,
      isSaving: false,
      
      user: null,
      accessToken: Cookies.get('accessToken') || null,
      refreshToken: Cookies.get('refreshToken') || null,
      isAuthenticated: !!Cookies.get('accessToken'),

      isCreateNoteModalOpen: false,
      isCreateGroupModalOpen: false,
      createGroupParentId: null,
      isUploadModalOpen: false,
      workspaces: [],
      selectedWorkspaceId: null,
      shareGroupId: null,
      moveGroupId: null,
      lockGroupId: null,
      renameGroupId: null,

      setAuth: (user, accessToken, refreshToken) => {
        Cookies.set('accessToken', accessToken, { expires: 7 });
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
        set({ 
          user, 
          accessToken, 
          refreshToken, 
          isAuthenticated: true 
        });
      },

      clearAuth: () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null, 
          isAuthenticated: false 
        });
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),

      setSaving: (saving) => set({ isSaving: saving }),

      addActivity: (activity) => set((state) => ({
        activities: [
          {
            ...activity,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: 'Just now',
            user: state.user?.displayName || 'Alex Rivers',
            dateGroup: 'Today'
          },
          ...state.activities
        ]
      })),

      addNote: (note) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => {
          const newNote: Note = {
            id,
            title: note.title || 'Untitled document',
            content: note.content || '',
            tags: note.tags || [],
            category: note.category || 'Work',
            lastEdited: 'Just now',
            author: state.user?.displayName || 'Alex Rivers',
            isFavorite: false,
            isLocked: false,
            hasAI: false,
            fileType: note.fileType || 'system_doc',
            ...note
          };
          
          return { 
            notes: [newNote, ...state.notes],
            selectedNoteId: id,
            activities: [
              { id: Math.random().toString(36).substr(2, 9), type: 'create', description: `Created: ${newNote.title}`, timestamp: 'Just now', user: state.user?.displayName || 'Alex Rivers', docRef: newNote.id, dateGroup: 'Today' },
              ...state.activities
            ]
          };
        });
        return id;
      },

      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, ...updates, lastEdited: 'Just now' } : n)
      })),

      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id)
      })),

      moveToBin: (id) => set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() } : n),
        activities: [{ id: Math.random().toString(36).substr(2, 9), type: 'delete', description: `Moved to bin: ${state.notes.find(n => n.id === id)?.title}`, timestamp: 'Just now', user: state.user?.displayName || 'Alex Rivers', docRef: id, dateGroup: 'Today' }, ...state.activities]
      })),

      restoreFromBin: (id) => set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, isDeleted: false, deletedAt: undefined } : n),
        activities: [{ id: Math.random().toString(36).substr(2, 9), type: 'restore', description: `Restored from bin: ${state.notes.find(n => n.id === id)?.title}`, timestamp: 'Just now', user: state.user?.displayName || 'Alex Rivers', docRef: id, dateGroup: 'Today' }, ...state.activities]
      })),

      permanentDeleteNote: (id) => set((state) => ({
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
          activities: [{ id: Math.random().toString(36).substr(2, 9), type: 'create', description: `Created group: ${group.name}`, timestamp: 'Just now', user: state.user?.displayName || 'Alex Rivers', dateGroup: 'Today' }, ...state.activities]
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
          author: state.user?.displayName || 'Alex Rivers',
          content: note.content,
          wordCount: note.content.split(/\s+/).length
        };

        return {
          notes: state.notes.map(n => n.id === noteId ? { ...n, versions: [newVersion, ...(n.versions || [])] } : n),
          activities: [{ id: Math.random().toString(36).substr(2, 9), type: 'version', description: `Created version ${label} for ${note.title}`, timestamp: 'Just now', user: state.user?.displayName || 'Alex Rivers', docRef: noteId, dateGroup: 'Today' }, ...state.activities]
        };
      }),

      restoreVersion: (noteId, versionId) => set((state) => {
        const note = state.notes.find(n => n.id === noteId);
        const version = note?.versions?.find(v => v.id === versionId);
        if (!note || !version) return state;

        return {
          notes: state.notes.map(n => n.id === noteId ? { ...n, content: version.content, lastEdited: 'Just now' } : n),
          activities: [{ id: Math.random().toString(36).substr(2, 9), type: 'restore', description: `Restored version ${version.label} for ${note.title}`, timestamp: 'Just now', user: state.user?.displayName || 'Alex Rivers', docRef: noteId, dateGroup: 'Today' }, ...state.activities]
        };
      }),

      setSelectedNote: (id) => set({ selectedNoteId: id }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setCreateNoteModalOpen: (open) => set({ isCreateNoteModalOpen: open }),
      setCreateGroupModalOpen: (open, parentId = null) => set({ 
        isCreateGroupModalOpen: open,
        createGroupParentId: parentId 
      }),
      setCreateGroupParentId: (id) => set({ createGroupParentId: id }),
      setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
      setShareGroup: (id) => set({ shareGroupId: id }),
      setMoveGroup: (id) => set({ moveGroupId: id }),
      setLockGroup: (id) => set({ lockGroupId: id }),
      setRenameGroup: (id) => set({ renameGroupId: id }),
    }),
    {
      name: 'notly-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        selectedWorkspaceId: state.selectedWorkspaceId,
        sidebarOpen: state.sidebarOpen,
        notes: state.notes,
      }),
    }
  )
);
