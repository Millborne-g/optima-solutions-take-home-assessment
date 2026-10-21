"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { cn } from "@/shared/lib/cn";
import { MAIN_NAV, isNavActive } from "./nav";

type AppSidebarProps = {
  mode: "desktop" | "drawer";
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
};

export function AppSidebar({
  mode,
  collapsed,
  onToggleCollapse,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const showLabels = mode === "drawer" || !collapsed;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border border-border bg-surface shadow-sm",
        mode === "desktop" && "rounded-xl",
        mode === "drawer" && "rounded-r-xl",
      )}
    >
      <div
        className={cn(
          "px-4 py-5",
          !showLabels && "flex justify-center px-2",
        )}
      >
        {showLabels ? (
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <p className="truncate text-sm font-semibold text-foreground">
              HubSpot Order Sync
            </p>
          </div>
        ) : (
          <BrandMark />
        )}
      </div>

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-4 py-2",
          !showLabels && "px-2",
        )}
        aria-label="Main"
      >
        {showLabels && (
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Main menu
          </p>
        )}
        <ul className="space-y-1">
          {MAIN_NAV.map((item) => {
            const active = isNavActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                    !showLabels && "justify-center px-2",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-surface-subtle",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <NavIcon href={item.href} />
                  {showLabels && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {mode === "desktop" && (
        <div
          className={cn(
            "mt-auto flex items-center border-t border-border/60 px-4 py-3",
            collapsed ? "flex-col gap-2 px-2" : "justify-between gap-2",
          )}
        >
          <ThemeToggle
            compact
            className="border-transparent bg-transparent shadow-none hover:bg-surface-subtle"
          />
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md",
                "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              )}
            >
              <CollapseIcon collapsed={collapsed} />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

function BrandMark() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      aria-hidden="true"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7h11M4 12h7M4 17h9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M16 9l4 3-4 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function NavIcon({ href }: { href: string }) {
  if (href === "/syncs") {
    return (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 7h16M4 12h10M4 17h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 19c0-2.8 2.2-5 5-5h0c2.8 0 5 2.2 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 11h4M18 9v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
