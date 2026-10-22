"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import {
  ContactsPageSkeleton,
  SyncsPageSkeleton,
} from "@/shared/ui/Skeleton";
import { AppSidebar } from "./AppSidebar";
import { MobileTopBar } from "./MobileTopBar";
import { SplashScreen } from "./SplashScreen";
import { titleForPath } from "./nav";

const FIRST_SKELETON_MS = 600;

const COLLAPSE_KEY = "sidebar_collapsed";
const COLLAPSE_EVENT = "sidebar-collapse";
const ISLAND_HEIGHT = "h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)]";

function subscribeCollapse(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}

function getCollapseSnapshot(): boolean {
  return localStorage.getItem(COLLAPSE_KEY) === "true";
}

function getCollapseServerSnapshot(): boolean {
  return false;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeCollapse,
    getCollapseSnapshot,
    getCollapseServerSnapshot,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [firstLoad, setFirstLoad] = useState<"splash" | "skeleton" | "ready">(
    "splash",
  );

  const onSplashFinished = useCallback(() => {
    setFirstLoad((current) => (current === "ready" ? current : "skeleton"));
  }, []);

  useEffect(() => {
    if (firstLoad !== "skeleton") return;
    const timer = window.setTimeout(() => {
      setFirstLoad("ready");
    }, FIRST_SKELETON_MS);
    return () => window.clearTimeout(timer);
  }, [firstLoad]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  function toggleCollapse() {
    localStorage.setItem(COLLAPSE_KEY, String(!collapsed));
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }

  const title = titleForPath(pathname);
  const showFirstLoadSkeleton = firstLoad !== "ready";
  const firstLoadSkeleton =
    pathname === "/syncs" ? <SyncsPageSkeleton /> : <ContactsPageSkeleton />;

  return (
    <div className="flex h-dvh overflow-hidden bg-background p-3 sm:p-4">
      <SplashScreen onFinished={onSplashFinished} />
      <div
        className={cn(
          "hidden shrink-0 md:block",
          ISLAND_HEIGHT,
          "transition-[width] duration-200 motion-reduce:transition-none",
          collapsed ? "w-16" : "w-64",
          "md:mr-4",
        )}
      >
        <AppSidebar
          mode="desktop"
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm",
          ISLAND_HEIGHT,
        )}
      >
        <MobileTopBar title={title} onOpenMenu={() => setDrawerOpen(true)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5 sm:p-6 md:p-8">
          {showFirstLoadSkeleton ? firstLoadSkeleton : children}
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close navigation menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-2 left-2 w-[min(18rem,calc(100vw-1rem))]">
            <div className="relative h-full">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className={cn(
                  "absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center",
                  "rounded-md border border-border bg-surface text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                )}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <AppSidebar
                mode="drawer"
                collapsed={false}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
