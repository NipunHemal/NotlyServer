
"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useStore } from '@/store/use-store';
import { useUpdateProfile, useChangePassword, useDeleteAccount } from '@/service/query/useUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Shield, Trash2, Camera, Loader2, Key, Mail, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useStore();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      username: user?.username || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onUpdateProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onChangePassword = (data: PasswordFormValues) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    passwordForm.reset();
  };

  const onDeleteAccount = () => {
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile, security settings, and account preferences.</p>
        </header>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-white/[0.03] border border-white/5 p-1 rounded-2xl h-14">
            <TabsTrigger value="profile" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <Shield className="w-4 h-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2 text-destructive data-[state=active]:bg-destructive">
              <Trash2 className="w-4 h-4" /> Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="m-0 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-panel border-white/5 overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5">
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your public profile details and avatar.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                      <Avatar className="w-32 h-32 border-4 border-primary/20">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback className="text-3xl font-black">{user?.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-1 text-center md:text-left">
                      <h3 className="text-xl font-bold">{user?.displayName || user?.username}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
                        <Mail className="w-3.5 h-3.5" /> {user?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                          {user?.role}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/[0.03] text-muted-foreground px-3 py-1 rounded-full border border-white/5">
                          ID: {user?.id?.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="displayName" {...profileForm.register('displayName')} className="pl-10 bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        {profileForm.formState.errors.displayName && <p className="text-xs text-destructive">{profileForm.formState.errors.displayName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                          <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="username" {...profileForm.register('username')} className="pl-10 bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        {profileForm.formState.errors.username && <p className="text-xs text-destructive">{profileForm.formState.errors.username.message}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Avatar URL</Label>
                      <Input id="avatarUrl" {...profileForm.register('avatarUrl')} placeholder="https://..." className="bg-white/5 border-white/10 rounded-xl" />
                      {profileForm.formState.errors.avatarUrl && <p className="text-xs text-destructive">{profileForm.formState.errors.avatarUrl.message}</p>}
                    </div>
                    <Button type="submit" className="w-full md:w-auto px-10 rounded-xl font-bold h-12" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="security" className="m-0 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-panel border-white/5">
                <CardHeader className="p-8 border-b border-white/5">
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Keep your account secure by using a strong password.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="max-w-md space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} className="pl-10 bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      {passwordForm.formState.errors.currentPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} className="pl-10 bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      {passwordForm.formState.errors.newPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} className="pl-10 bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                    <Button type="submit" className="w-full rounded-xl font-bold h-12" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="account" className="m-0 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-panel border-destructive/20 bg-destructive/5">
                <CardHeader className="p-8">
                  <CardTitle className="text-destructive">Delete Account</CardTitle>
                  <CardDescription className="text-destructive/60">
                    Once you delete your account, there is no going back. Please be certain.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Deleting your account will permanently remove all your documents, groups, and personal data from our servers. 
                    This action is irreversible.
                  </p>
                </CardContent>
                <CardFooter className="p-8 border-t border-destructive/10">
                  <Button variant="destructive" className="rounded-xl font-bold h-12 px-8 shadow-lg shadow-destructive/20" onClick={onDeleteAccount} disabled={deleteAccountMutation.isPending}>
                    {deleteAccountMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Delete Permanently
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
