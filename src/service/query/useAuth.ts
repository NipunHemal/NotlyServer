
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, LoginCredentials, RegisterCredentials } from '../functions/auth.service';
import { useStore } from '@/store/use-store';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
  const setAuth = useStore((state) => state.setAuth);
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast({
        title: 'Welcome back!',
        description: `Successfully signed in as ${data.user.displayName || data.user.username}`,
      });
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid email or password',
      });
    },
  });
};

export const useRegister = () => {
  const setAuth = useStore((state) => state.setAuth);
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast({
        title: 'Account Created',
        description: 'Welcome to Notly! Your workspace is ready.',
      });
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'Could not create account. Please try again.',
      });
    },
  });
};

export const useLogout = () => {
  const { refreshToken, clearAuth } = useStore();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: () => logout(refreshToken || ''),
    onSuccess: () => {
      clearAuth();
      toast({
        title: 'Logged out',
        description: 'See you soon!',
      });
      router.push('/');
    },
    onSettled: () => {
      clearAuth();
      router.push('/');
    }
  });
};
