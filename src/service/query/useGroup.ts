
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  createGroup, getGroupById, getGroupChildren, getGroupTree, 
  getGroupBreadcrumb, renameGroup, getGroupStats, moveGroup, 
  deleteGroup, toggleGroupFavorite, getCollaborators, shareGroup,
  archiveGroup, unarchiveGroup, duplicateGroup,
  CreateGroupData, Group
} from '../functions/group.service';
import { useToast } from '@/hooks/use-toast';

export const useGroupTree = (workspaceId?: string) => {
  return useQuery({
    queryKey: ['groups', 'tree', workspaceId],
    queryFn: () => getGroupTree(workspaceId!),
    enabled: !!workspaceId,
  });
};

export const useGroupById = (id: string) => {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => getGroupById(id),
    enabled: !!id,
  });
};

export const useGroupChildren = (id: string, unlockToken?: string) => {
  return useQuery({
    queryKey: ['groups', id, 'children', unlockToken],
    queryFn: () => getGroupChildren(id, unlockToken),
    enabled: !!id,
  });
};

export const useGroupBreadcrumb = (id: string) => {
  return useQuery({
    queryKey: ['groups', id, 'breadcrumb'],
    queryFn: () => getGroupBreadcrumb(id),
    enabled: !!id,
  });
};

export const useGroupStats = (id: string) => {
  return useQuery({
    queryKey: ['groups', id, 'stats'],
    queryFn: () => getGroupStats(id),
    enabled: !!id,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      if (variables.parent_id) {
        queryClient.invalidateQueries({ queryKey: ['groups', variables.parent_id, 'children'] });
        queryClient.invalidateQueries({ queryKey: ['groups', variables.parent_id, 'stats'] });
      }
      toast({
        title: 'Group Created',
        description: 'Your new group has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create group',
        description: error.message || 'An error occurred while creating the group.',
      });
    },
  });
};

export const useRenameGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameGroup(id, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.id] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.id, 'breadcrumb'] });
      toast({
        title: 'Group Renamed',
        description: `Group successfully renamed to ${data.name}.`,
      });
    },
  });
};

export const useDeleteGroup = (parentId?: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['groups', parentId, 'children'] });
        queryClient.invalidateQueries({ queryKey: ['groups', parentId, 'stats'] });
      }
      toast({
        title: 'Group Deleted',
        description: 'The group and its contents have been moved to the bin.',
      });
    },
  });
};

export const useMoveGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, target_parent_id, sort_order }: { id: string; target_parent_id: string | null; sort_order?: number }) => 
      moveGroup(id, target_parent_id, sort_order),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.id] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.id, 'breadcrumb'] });
      toast({
        title: 'Group Moved',
        description: 'Group position updated successfully.',
      });
    },
  });
};

export const useToggleGroupFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleGroupFavorite,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.id] });
    },
  });
};

export const useCollaborators = (id: string) => {
  return useQuery({
    queryKey: ['groups', id, 'collaborators'],
    queryFn: () => getCollaborators(id),
    enabled: !!id,
  });
};

export const useShareGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, email, role }: { id: string; email: string; role: 'EDITOR' | 'VIEWER' }) => 
      shareGroup(id, email, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', variables.id, 'collaborators'] });
      toast({
        title: 'Group Shared',
        description: `Access granted to ${variables.email}.`,
      });
    },
  });
};

export const useArchiveGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: archiveGroup,
    onSuccess: (data: Group) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.id] });
      toast({
        title: 'Group Archived',
        description: 'Group and its descendants have been archived.',
      });
    },
  });
};

export const useUnarchiveGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: unarchiveGroup,
    onSuccess: (data: Group) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.id] });
      toast({
        title: 'Group Unarchived',
        description: 'Group successfully restored from archive.',
      });
    },
  });
};

export const useDuplicateGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, target_parent_id }: { id: string; target_parent_id: string | null }) => 
      duplicateGroup(id, target_parent_id),
    onSuccess: (data: Group) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      if (data.parent_id) {
        queryClient.invalidateQueries({ queryKey: ['groups', data.parent_id, 'children'] });
        queryClient.invalidateQueries({ queryKey: ['groups', data.parent_id, 'stats'] });
      }
      toast({
        title: 'Group Duplicated',
        description: `Successfully created copy: ${data.name}.`,
      });
    },
  });
};
