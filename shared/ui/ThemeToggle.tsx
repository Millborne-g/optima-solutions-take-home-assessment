"use client";

import { useTheme } from "@/app/theme";
import { cn } from "@/shared/lib/cn";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { resolved, cycleTheme } = useTheme();

  const label = resolved === "dark" ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} theme`}
      title={`Theme: ${label}`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface",
        "text-foreground hover:bg-surface-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        compact ? "h-9 w-9 p-0" : "px-3 py-1.5 text-sm font-medium",
        className,
      )}
    >
      {resolved === "dark" ? <MoonIcon /> : <SunIcon />}
      {!compact && <span>{label}</span>}
    </button>
  );
}

function SunIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 0110.5 3 7 7 0 1019 18.5c.7-.6 1.3-1.3 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
