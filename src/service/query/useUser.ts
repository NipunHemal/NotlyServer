
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getMe, updateProfile, changePassword, deleteAccount, 
  UpdateProfileData, ChangePasswordData 
} from '../functions/user.service';
import { useStore } from '@/store/use-store';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export const useMe = () => {
  const setUser = useStore((state) => state.updateUser);
  
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const user = await getMe();
      setUser(user);
      return user;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useStore((state) => state.updateUser);
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['users', 'me'], data);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update profile. Please try again.',
      });
    },
  });
};

export const useChangePassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to change password',
        description: error.message || 'Please check your current password and try again.',
      });
    },
  });
};

export const useDeleteAccount = () => {
  const clearAuth = useStore((state) => state.clearAuth);
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: (data) => {
      toast({
        title: 'Account Deleted',
        description: data.message,
      });
      clearAuth();
      router.push('/');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || 'Could not delete account. Please contact support.',
      });
    },
  });
};
