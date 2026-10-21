"use client";

import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { cn } from "@/shared/lib/cn";

type MobileTopBarProps = {
  title: string;
  onOpenMenu: () => void;
};

export function MobileTopBar({ title, onOpenMenu }: MobileTopBarProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 border-b border-border px-3 py-3 md:hidden",
        "bg-surface",
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border",
          "bg-surface text-foreground hover:bg-surface-subtle",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        )}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
        {title}
      </h1>
      <ThemeToggle compact />
    </header>
  );
}
