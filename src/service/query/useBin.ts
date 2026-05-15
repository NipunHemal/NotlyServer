
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBinItems, restoreBinItem, deleteBinItemPermanently, emptyBin } from "../functions/bin.service";
import { useToast } from "@/hooks/use-toast";

export const useBinItems = () => {
  return useQuery({
    queryKey: ['bin'],
    queryFn: getBinItems,
  });
};

export const useRestoreBinItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: restoreBinItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bin'] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'tree'] });
      toast({
        title: 'Item Restored',
        description: 'The item has been restored to its original location.',
      });
    },
  });
};

export const usePermanentDeleteBinItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteBinItemPermanently,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bin'] });
      toast({
        title: 'Permanently Deleted',
        description: 'The item has been permanently removed.',
      });
    },
  });
};

export const useEmptyBin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: emptyBin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bin'] });
      toast({
        title: 'Bin Emptied',
        description: 'All items have been permanently removed.',
      });
    },
  });
};
