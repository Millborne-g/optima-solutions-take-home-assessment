"use client";

import { useEffect, useState } from "react";
import { SearchField } from "@/shared/ui/SearchField";

type DebouncedSearchFieldProps = {
  /** Remount with a new `key` when the committed URL query changes. */
  initialValue: string;
  onCommit: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
};

/**
 * Local search input that debounces commits to the parent (typically a URL update).
 * Sync from URL by remounting with `key={committedQuery}` — avoids setState-in-effect.
 */
export function DebouncedSearchField({
  initialValue,
  onCommit,
  debounceMs = 300,
  placeholder,
  "aria-label": ariaLabel,
  className,
}: DebouncedSearchFieldProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (value.trim() === initialValue.trim()) return;
      onCommit(value.trim());
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [value, initialValue, onCommit, debounceMs]);

  return (
    <SearchField
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  );
}
