
"use client";

import React from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { Home, FileText, FolderOpen, Clock, Users, Star, Activity, Trash2, Settings, Search, Plus, Bell, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/use-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useStore();

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: FileText, label: 'All Docs', href: '/docs' },
    { icon: FolderOpen, label: 'Groups', href: '/groups' },
    { icon: Clock, label: 'Recent', href: '/recent' },
    { icon: Users, label: 'Shared With Me', href: '/shared' },
    { icon: Star, label: 'Favorites', href: '/favorites' },
    { icon: Activity, label: 'Activities', href: '/activities' },
    { icon: Trash2, label: 'Bin', href: '/bin' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-white/5 bg-sidebar">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">C</div>
              <span className="font-bold text-lg tracking-tight">CognitoNotes AI</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.label}
                        className="transition-all duration-200 hover:bg-white/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                      >
                        <Link href={item.href} className="flex items-center gap-3 py-2 px-3 rounded-md">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src="https://picsum.photos/seed/user-42/100/100" />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">Alex Rivers</span>
                <span className="text-xs text-muted-foreground truncate">Pro Plan</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 relative">
          <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search notes, tags, collaborators..." 
                  className="w-full bg-white/[0.03] border-white/10 pl-10 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <Button variant="ghost" size="icon" className="relative hover:bg-white/5">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
              </Button>
              <Button className="rounded-full px-6 gap-2 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Note</span>
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
