
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getNoteById, 
  listNotes,
  createNote, 
  updateNote, 
  autosaveNote,
  deleteNote, 
  getNoteVersions, 
  restoreNoteVersion, 
  toggleNoteFavorite,
  moveNote,
  duplicateNote,
  archiveNote,
  unarchiveNote,
  createPublicLink,
  revokePublicLink,
  Note,
  UpdateNoteRequest,
  CreateNoteRequest
} from "../functions/note.service";
import { useToast } from "@/hooks/use-toast";

export const useNote = (id: string, unlockToken?: string) => {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => getNoteById(id, unlockToken),
    enabled: !!id,
    staleTime: 30000,
  });
};

export const useNotes = (params: { group_id?: string; status?: string; favorite?: boolean }) => {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: () => listNotes(params),
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createNote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: ['groups', data.group_id, 'children'] });
      }
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateNoteRequest }) => updateNote(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notes', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useAutosaveNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateNoteRequest }) => autosaveNote(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notes', data.id], data);
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast({
          variant: 'destructive',
          title: 'Concurrency Conflict',
          description: 'This document was updated elsewhere. Please refresh to sync changes.',
        });
      }
    }
  });
};

export const useDeleteNote = (groupId?: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'children'] });
      }
      toast({
        title: 'Note deleted',
        description: 'The note has been moved to the bin.',
      });
    },
  });
};

export const useNoteVersions = (id: string, page = 0, size = 20) => {
  return useQuery({
    queryKey: ['notes', id, 'versions', page, size],
    queryFn: () => getNoteVersions(id, page, size),
    enabled: !!id,
  });
};

export const useRestoreVersion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, versionId }: { id: string, versionId: string }) => restoreNoteVersion(id, versionId),
    onSuccess: (data) => {
      queryClient.setQueryData(['notes', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['notes', data.id, 'versions'] });
      toast({
        title: 'Version restored',
        description: `Successfully reverted to version ${data.version_number}.`,
      });
    },
  });
};

export const useToggleNoteFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleNoteFavorite,
    onSuccess: (data) => {
      queryClient.setQueryData(['notes', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useMoveNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, targetGroupId }: { id: string, targetGroupId: string }) => moveNote(id, targetGroupId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Note moved', description: 'Document location has been updated.' });
    },
  });
};

export const useDuplicateNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: duplicateNote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: 'Note duplicated', description: `Created copy: ${data.title}` });
    },
  });
};

export const useArchiveNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: archiveNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: 'Note archived', description: 'Document moved to archives.' });
    },
  });
};

export const useUnarchiveNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: unarchiveNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: 'Note restored', description: 'Document moved to active workspace.' });
    },
  });
};

export const usePublicLink = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: createPublicLink,
    onSuccess: () => {
      toast({ title: 'Public link created', description: 'You can now share this note.' });
    },
  });
};

export const useRevokePublicLink = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: revokePublicLink,
    onSuccess: () => {
      toast({ title: 'Link revoked', description: 'Note is now private.' });
    },
  });
};
