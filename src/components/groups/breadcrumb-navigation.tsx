
"use client";

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { Group, useStore } from '@/store/use-store';

interface BreadcrumbNavigationProps {
  currentGroupId?: string;
}

export function BreadcrumbNavigation({ currentGroupId }: BreadcrumbNavigationProps) {
  const { groups } = useStore();

  const getBreadcrumbs = () => {
    const crumbs: { name: string; href: string }[] = [];
    if (!currentGroupId) return crumbs;

    let current = groups.find(g => g.id === currentGroupId);
    while (current) {
      const node = current;
      crumbs.unshift({ name: node.name, href: `/groups/${node.id}` });
      current = groups.find(g => g.id === node.parentId);
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
      </Link>
      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
      <Link href="/groups" className="hover:text-foreground transition-colors">
        Groups
      </Link>
      {breadcrumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link 
            href={crumb.href} 
            className={`hover:text-foreground transition-colors ${idx === breadcrumbs.length - 1 ? 'text-foreground font-bold' : ''}`}
          >
            {crumb.name}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
