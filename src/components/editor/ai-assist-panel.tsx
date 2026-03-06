
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Tag, Layout, FileText, Loader2, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiSmartTagSuggestion } from '@/ai/flows/ai-smart-tag-suggestion';
import { aiCategoryPrediction } from '@/ai/flows/ai-category-prediction';
import { generateNoteSummary } from '@/ai/flows/ai-summary-generator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AIAssistPanelProps {
  content: string;
  onApplyTags: (tags: string[]) => void;
  onApplyCategory: (category: string) => void;
  onApplySummary: (summary: string) => void;
}

export function AIAssistPanel({ content, onApplyTags, onApplyCategory, onApplySummary }: AIAssistPanelProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<{
    tags?: string[];
    category?: string;
    summary?: string;
  }>({});
  const { toast } = useToast();

  const handleAction = async (type: 'tags' | 'category' | 'summary') => {
    if (!content.trim()) {
      toast({ title: "Content required", description: "Please add some text first.", variant: "destructive" });
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      if (type === 'tags') {
        const res = await aiSmartTagSuggestion({ noteContent: content });
        setSuggestions(prev => ({ ...prev, tags: res.suggestedTags }));
      } else if (type === 'category') {
        const res = await aiCategoryPrediction({ noteContent: content });
        setSuggestions(prev => ({ ...prev, category: res.predictedCategory }));
      } else if (type === 'summary') {
        const res = await generateNoteSummary({ noteContent: content });
        setSuggestions(prev => ({ ...prev, summary: res.summary }));
      }
    } catch (err) {
      toast({ title: "AI Error", description: "Failed to generate AI suggestion.", variant: "destructive" });
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      <div className="flex items-center gap-2 text-ai mb-2">
        <Sparkles className="w-5 h-5" />
        <h3 className="text-sm font-bold uppercase tracking-widest">AI Assistant</h3>
      </div>

      <div className="space-y-4">
        {/* Suggest Tags */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Smart Tags
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 text-[10px] px-2 text-ai hover:text-ai hover:bg-ai/10"
              onClick={() => handleAction('tags')}
              disabled={loading.tags}
            >
              {loading.tags ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              {suggestions.tags ? 'Refresh' : 'Generate'}
            </Button>
          </div>
          {suggestions.tags && (
            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
              {suggestions.tags.map(tag => (
                <Badge key={tag} onClick={() => onApplyTags([tag])} className="cursor-pointer bg-ai/20 text-ai hover:bg-ai/30 border-none transition-colors">
                  +{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Predict Category */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5" /> Category
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 text-[10px] px-2 text-ai hover:text-ai hover:bg-ai/10"
              onClick={() => handleAction('category')}
              disabled={loading.category}
            >
              {loading.category ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              {suggestions.category ? 'Regenerate' : 'Analyze'}
            </Button>
          </div>
          {suggestions.category && (
            <div 
              onClick={() => onApplyCategory(suggestions.category!)}
              className="p-3 rounded-xl bg-ai/5 border border-ai/20 flex items-center justify-between cursor-pointer hover:bg-ai/10 transition-all group animate-in fade-in slide-in-from-top-1"
            >
              <span className="text-sm font-medium">{suggestions.category}</span>
              <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Generate Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Auto-Summary
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 text-[10px] px-2 text-ai hover:text-ai hover:bg-ai/10"
              onClick={() => handleAction('summary')}
              disabled={loading.summary}
            >
              {loading.summary ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              {suggestions.summary ? 'Regenerate' : 'Summarize'}
            </Button>
          </div>
          {suggestions.summary && (
            <div className="relative group animate-in fade-in slide-in-from-top-1">
              <p className="text-xs leading-relaxed text-muted-foreground italic p-3 rounded-xl bg-white/[0.02] border border-white/5">
                "{suggestions.summary}"
              </p>
              <Button 
                size="sm" 
                onClick={() => onApplySummary(suggestions.summary!)}
                className="w-full mt-2 h-8 text-[10px] rounded-lg bg-ai text-ai-foreground"
              >
                Apply Summary
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
