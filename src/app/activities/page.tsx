
"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useMyActivities, useMyActivitiesByEntity, useMyActivityStats } from '@/service/query/useActivity';
import { ActivityItem, EntityType, ActionType } from '@/service/functions/activity.service';
import {
  Activity as ActivityIcon, Edit2, Share2, History,
  Trash2, Key, Plus, Filter, Search,
  Clock, FileText, FolderOpen, Eye, Star, Archive,
  Lock, Unlock, RotateCcw, ChevronLeft, ChevronRight, Loader2,
  TrendingUp, Zap, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// --- Action icon/color mapping ---

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  CREATED:          { icon: Plus,      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Created' },
  UPDATED:          { icon: Edit2,     color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Updated' },
  DELETED:          { icon: Trash2,    color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Deleted' },
  RESTORED:         { icon: RotateCcw, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', label: 'Restored' },
  SHARED:           { icon: Share2,    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', label: 'Shared' },
  UNSHARED:         { icon: Share2,    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', label: 'Unshared' },
  LOCKED:           { icon: Lock,      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Locked' },
  UNLOCKED:         { icon: Unlock,    color: 'text-lime-400 bg-lime-500/10 border-lime-500/20', label: 'Unlocked' },
  VERSION_CREATED:  { icon: History,   color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', label: 'Version Saved' },
  VERSION_RESTORED: { icon: RotateCcw, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', label: 'Version Restored' },
  ARCHIVED:         { icon: Archive,   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', label: 'Archived' },
  FAVORITED:        { icon: Star,      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', label: 'Favorited' },
  VIEWED:           { icon: Eye,       color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', label: 'Viewed' },
};

const ENTITY_ICON: Record<string, any> = {
  NOTE: FileText,
  GROUP: FolderOpen,
  VERSION: History,
  COLLABORATOR: Share2,
  WORKSPACE: FolderOpen,
};

const ENTITY_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NOTE', label: 'Notes' },
  { value: 'GROUP', label: 'Groups' },
  { value: 'VERSION', label: 'Versions' },
  { value: 'WORKSPACE', label: 'Workspace' },
];

// --- Helper ---

function getActivityDescription(item: ActivityItem): string {
  const title = item.metadata?.title || item.metadata?.name || '';
  const entityLabel = item.entityType.toLowerCase();

  switch (item.action) {
    case 'CREATED':
      return `created ${entityLabel} ${title ? `"${title}"` : ''}`;
    case 'UPDATED':
      return `updated ${entityLabel} ${title ? `"${title}"` : ''}`;
    case 'DELETED':
      return `deleted ${entityLabel} ${title ? `"${title}"` : ''}`;
    case 'RESTORED':
      return `restored ${entityLabel} ${title ? `"${title}"` : ''} from bin`;
    case 'SHARED':
      return `shared ${entityLabel} ${title ? `"${title}"` : ''} with ${item.metadata?.shared_with || 'someone'}`;
    case 'UNSHARED':
      return `removed sharing for ${entityLabel} ${title ? `"${title}"` : ''}`;
    case 'LOCKED':
      return `locked ${entityLabel} ${title ? `"${title}"` : ''}`;
    case 'UNLOCKED':
      return `unlocked ${entityLabel} ${title ? `"${title}"` : ''}`;
    case 'VERSION_CREATED':
      return `saved a version of ${title ? `"${title}"` : entityLabel}`;
    case 'VERSION_RESTORED':
      return `restored a previous version of ${title ? `"${title}"` : entityLabel}`;
    case 'ARCHIVED':
      return `archived ${entityLabel} ${title ? `"${title}"` : ''}`;
    case 'FAVORITED':
      return `toggled favorite on ${entityLabel} ${title ? `"${title}"` : ''}`;
    case 'VIEWED':
      return `viewed ${entityLabel} ${title ? `"${title}"` : ''}`;
    default:
      return `performed ${item.action.toLowerCase()} on ${entityLabel}`;
  }
}

function getEntityLink(item: ActivityItem): string | null {
  if (item.entityType === 'NOTE') return `/notes/${item.entityId}`;
  if (item.entityType === 'GROUP') return `/groups/${item.entityId}`;
  return null;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

function groupByDate(items: ActivityItem[]): Record<string, ActivityItem[]> {
  const groups: Record<string, ActivityItem[]> = {};
  const now = new Date();

  for (const item of items) {
    const date = new Date(item.createdAt);
    if (isNaN(date.getTime())) {
      (groups['Older'] ??= []).push(item);
      continue;
    }

    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else if (diffDays < 7) label = 'This Week';
    else if (diffDays < 30) label = 'This Month';
    else label = 'Older';

    (groups[label] ??= []).push(item);
  }

  return groups;
}

// --- Page ---

export default function ActivitiesPage() {
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 30;

  // Conditional fetching based on filter
  const allQuery = useMyActivities(page, pageSize);
  const filteredQuery = useMyActivities(page, pageSize); // We'll use entity-specific if needed
  const entityQuery = useMyActivitiesByEntity(entityFilter as EntityType, page, pageSize);
  const statsQuery = useMyActivityStats();

  const isFiltered = entityFilter !== 'ALL';
  const activeQuery = isFiltered ? entityQuery : allQuery;
  const { data, isLoading } = activeQuery;
  const stats = statsQuery.data;

  const activities = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const grouped = groupByDate(activities);
  const dateOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em]">
              <ActivityIcon className="w-3.5 h-3.5" /> Audit Log
            </div>
            <h1 className="text-4xl font-black tracking-tight">System Activity</h1>
            <p className="text-muted-foreground">Complete audit trail of all operations across your workspace.</p>
          </div>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5" /> Total
              </div>
              <p className="text-3xl font-black">{stats.totalActivities}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5" /> Today
              </div>
              <p className="text-3xl font-black text-primary">{stats.todayCount}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest">
                <TrendingUp className="w-3.5 h-3.5" /> This Week
              </div>
              <p className="text-3xl font-black">{stats.weekCount}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest">
                <Star className="w-3.5 h-3.5" /> Top Action
              </div>
              <p className="text-lg font-black text-emerald-400">{stats.topAction}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {ENTITY_FILTERS.map(f => (
            <Button
              key={f.value}
              variant={entityFilter === f.value ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "rounded-xl h-8 text-xs font-bold",
                entityFilter === f.value && "bg-primary/10 text-primary border border-primary/20"
              )}
              onClick={() => { setEntityFilter(f.value); setPage(0); }}
            >
              {f.label}
            </Button>
          ))}
          <div className="ml-auto text-[11px] text-muted-foreground/40 font-medium">
            {totalElements} total activities
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-10 pb-20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Loading Activity Stream…</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                <ActivityIcon className="w-8 h-8 text-muted-foreground/15" />
              </div>
              <h3 className="text-lg font-bold">No activity yet</h3>
              <p className="text-sm text-muted-foreground/50 max-w-sm">Your activity log will populate as you create, edit, and manage notes and groups.</p>
            </div>
          ) : (
            dateOrder.filter(key => grouped[key]).map(dateGroup => (
              <section key={dateGroup} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 whitespace-nowrap">
                    {dateGroup}
                  </h2>
                  <div className="h-px w-full bg-white/5" />
                  <span className="text-[10px] text-muted-foreground/20 font-bold whitespace-nowrap">{grouped[dateGroup].length}</span>
                </div>

                <div className="space-y-1">
                  {grouped[dateGroup].map((item) => {
                    const config = ACTION_CONFIG[item.action] || ACTION_CONFIG.UPDATED;
                    const Icon = config.icon;
                    const EntityIcon = ENTITY_ICON[item.entityType] || FileText;
                    const link = getEntityLink(item);

                    const content = (
                      <div className="group flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5 cursor-pointer">
                        {/* Action icon */}
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shrink-0", config.color)}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium leading-snug text-foreground/80">
                            You {getActivityDescription(item)}
                          </p>
                        </div>

                        {/* Meta */}
                        <div className="hidden md:flex items-center gap-3 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 border-white/5 rounded-md"
                          >
                            <EntityIcon className="w-3 h-3 mr-1" />
                            {item.entityType}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground/30 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    );

                    return link ? (
                      <Link key={item.id} href={link}>
                        {content}
                      </Link>
                    ) : (
                      <div key={item.id}>{content}</div>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 border-white/10"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground/50 font-bold">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 border-white/10"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
