
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Github, Chrome, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegister } from '@/service/query/useAuth';
import { initiateGoogleLogin } from '@/lib/oauth';

const signupSchema = z.object({
  display_name: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { mutate: registerUser, isPending } = useRegister();
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      display_name: '',
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    registerUser(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 glass-panel p-10 rounded-[2.5rem]"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground">Join Notly today and start organizing your thoughts</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="rounded-xl border-white/10 hover:bg-white/5 gap-2" 
              disabled={isPending}
              onClick={initiateGoogleLogin}
            >
              <Chrome className="w-4 h-4" /> Google
            </Button>
            <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 gap-2" disabled={isPending}>
              <Github className="w-4 h-4" /> Github
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Full Name</Label>
              <Input 
                id="display_name" 
                placeholder="John Doe" 
                className="bg-white/5 border-white/10 rounded-xl" 
                {...register('display_name')}
                disabled={isPending}
              />
              {errors.display_name && <p className="text-xs text-destructive">{errors.display_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="johndoe" 
                className="bg-white/5 border-white/10 rounded-xl" 
                {...register('username')}
                disabled={isPending}
              />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="bg-white/5 border-white/10 rounded-xl" 
                {...register('email')}
                disabled={isPending}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="bg-white/5 border-white/10 rounded-xl" 
                {...register('password')}
                disabled={isPending}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl py-6 text-lg font-semibold shadow-lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
