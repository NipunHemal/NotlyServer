
"use client";

import React from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { Home, FileText, FolderOpen, Clock, Users, Star, Activity, Trash2, Settings, Search, Plus, Bell, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/use-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreateNoteModal } from '@/components/modals/create-note-modal';
import { CreateGroupModal } from '@/components/modals/create-group-modal';
import { GlobalSearch } from '@/components/search/global-search';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, setCreateNoteModalOpen, setSearchOpen } = useStore();

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: FileText, label: 'All Docs', href: '/docs' },
    { icon: FolderOpen, label: 'Groups', href: '/groups' },
    { icon: Activity, label: 'Activities', href: '/activities' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30 selection:text-white">
        <Sidebar className="border-r border-white/5 bg-sidebar">
          <SidebarHeader className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/20">C</div>
              <span className="font-black text-xl tracking-tighter text-white">Cognito</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.label}
                        className="transition-all duration-200 hover:bg-white/5 rounded-xl h-11 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                      >
                        <Link href={item.href} className="flex items-center gap-3 py-2 px-3">
                          <item.icon className="w-5 h-5" />
                          <span className="text-sm font-bold">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Favorites</SidebarGroupLabel>
              <SidebarMenu className="px-2 mt-4 space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton className="h-10 rounded-xl hover:bg-white/5 text-muted-foreground/60 hover:text-white">
                    <Star className="w-4 h-4 text-yellow-500/50" />
                    <span className="text-sm font-medium">Phoenix Roadmap</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="h-10 rounded-xl hover:bg-white/5 text-muted-foreground/60 hover:text-white">
                    <Star className="w-4 h-4 text-yellow-500/50" />
                    <span className="text-sm font-medium">Q4 Strategy</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-6">
            <div className="flex items-center gap-4 p-3 rounded-[1.75rem] bg-white/[0.03] border border-white/5">
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarImage src="https://picsum.photos/seed/user-42/100/100" />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black truncate text-white leading-tight">Alex Rivers</span>
                <span className="text-[10px] text-primary truncate uppercase font-black tracking-widest">Pro Account</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 relative">
          <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
              <div 
                className="relative w-full group cursor-pointer"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="w-full bg-white/[0.03] border border-white/5 h-12 rounded-2xl pl-12 pr-6 flex items-center justify-between text-muted-foreground/40 text-sm hover:border-white/20 transition-all font-medium">
                  <span>Search everything...</span>
                  <div className="flex items-center gap-1.5 opacity-50">
                    <kbd className="bg-white/5 px-2 py-1 rounded-lg border border-white/10 text-[9px] font-mono">⌘K</kbd>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 ml-6">
              <Button variant="ghost" size="icon" className="relative hover:bg-white/5 rounded-2xl h-11 w-11">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-background"></span>
              </Button>
              <Button 
                onClick={() => setCreateNoteModalOpen(true)}
                className="rounded-2xl h-12 px-8 gap-3 bg-primary hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 text-white font-black"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span className="hidden sm:inline">New Doc</span>
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      
      {/* Global Modals */}
      <GlobalSearch />
      <CreateNoteModal />
      <CreateGroupModal />
    </SidebarProvider>
  );
}
