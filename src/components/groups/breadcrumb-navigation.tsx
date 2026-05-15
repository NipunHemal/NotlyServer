
"use client";

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
}

export function BreadcrumbNavigation({ items = [] }: BreadcrumbNavigationProps) {
  return (
    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
      <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
        <div className="p-1 rounded-md group-hover:bg-primary/10 transition-colors">
          <Home className="w-3 h-3" />
        </div>
      </Link>
      
      <ChevronRight className="w-3 h-3 opacity-30" />
      
      <Link href="/dashboard" className="hover:text-primary transition-colors">
        Knowledge Base
      </Link>

      {items.map((crumb, idx) => (
        <React.Fragment key={crumb.id}>
          <ChevronRight className="w-3 h-3 opacity-30" />
          <Link 
            href={`/groups/${crumb.id}`} 
            className={`hover:text-primary transition-colors ${idx === items.length - 1 ? 'text-foreground font-black' : ''}`}
          >
            {crumb.name}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
