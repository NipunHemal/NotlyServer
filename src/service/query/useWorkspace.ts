
import { useQuery } from '@tanstack/react-query';
import { getWorkspaces, Workspace } from '../functions/workspace.service';
import { useStore } from '@/store/use-store';
import { useEffect } from 'react';

export const useWorkspaces = () => {
  const { setWorkspaces, setSelectedWorkspaceId, selectedWorkspaceId } = useStore();
  
  const query = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  useEffect(() => {
    if (query.data) {
      setWorkspaces(query.data);
      // If no workspace is selected, select the first one
      if (!selectedWorkspaceId && query.data.length > 0) {
        setSelectedWorkspaceId(query.data[0].id);
      }
    }
  }, [query.data, setWorkspaces, setSelectedWorkspaceId, selectedWorkspaceId]);

  return query;
};
