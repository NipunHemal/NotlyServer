
import { useEffect, useRef, useCallback } from 'react';

interface UseAutosaveProps {
  onSave: (content: any) => void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutosave({ onSave, debounceMs = 2000, enabled = true }: UseAutosaveProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const debouncedSave = useCallback((content: any) => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSaveRef.current(content);
    }, debounceMs);
  }, [debounceMs, enabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedSave;
}
