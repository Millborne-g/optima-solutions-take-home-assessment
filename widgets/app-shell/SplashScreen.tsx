"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BrandMark } from "@/shared/ui/BrandMark";
import { cn } from "@/shared/lib/cn";

const FADE_AT_MS = 1700;
const FINISH_AT_MS = 2000;

const STEPS = [
  "Connecting to HubSpot",
  "Loading contacts",
  "Checking order syncs",
] as const;

/** When each step becomes done (ms from mount). */
const STEP_DONE_AT = [400, 900, 1400] as const;

type StepState = "pending" | "active" | "done";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

type SplashScreenProps = {
  onFinished?: () => void;
};

/**
 * Full-viewport brand splash on hard load / reload only.
 * Mounts once with AppShell — does not re-show on client navigations.
 */
export function SplashScreen({ onFinished }: SplashScreenProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");
  const [entered, setEntered] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      onFinished?.();
      return;
    }

    const enterFrame = window.requestAnimationFrame(() => {
      setEntered(true);
    });

    const stepTimers = STEP_DONE_AT.map((at, index) =>
      window.setTimeout(() => {
        setDoneCount(index + 1);
      }, at),
    );

    const fadeTimer = window.setTimeout(() => {
      setPhase("fading");
    }, FADE_AT_MS);

    const removeTimer = window.setTimeout(() => {
      setPhase("gone");
      onFinished?.();
    }, FINISH_AT_MS);

    return () => {
      window.cancelAnimationFrame(enterFrame);
      for (const id of stepTimers) window.clearTimeout(id);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [reducedMotion, onFinished]);

  if (reducedMotion || phase === "gone") return null;

  const progressPercent = Math.min(100, (doneCount / STEPS.length) * 100);

  function stateFor(index: number): StepState {
    if (index < doneCount) return "done";
    if (index === doneCount) return "active";
    return "pending";
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col bg-background",
        "transition-opacity duration-300 motion-reduce:transition-none",
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      role="status"
      aria-busy={phase === "visible"}
      aria-live="polite"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div
          className={cn(
            "flex w-full max-w-sm flex-col items-center transition-all duration-500 motion-reduce:transition-none",
            entered
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0",
          )}
        >
          <div className="rounded-xl p-0.5 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_35%,transparent)] ring-2 ring-primary/40">
            <BrandMark size="lg" />
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
            HubSpot Order Sync
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Getting your workspace ready...
          </p>

          <div
            className="mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-subtle"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <ul className="mt-8 w-full max-w-xs space-y-3">
            {STEPS.map((label, index) => {
              const state = stateFor(index);
              return (
                <li key={label} className="flex items-center gap-3">
                  <StepIcon state={state} />
                  <span
                    className={cn(
                      "text-sm transition-colors duration-300",
                      state === "done" && "text-foreground",
                      state === "active" && "font-medium text-foreground",
                      state === "pending" && "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>

          <span className="sr-only">Loading application</span>
        </div>
      </div>

      <p className="pb-8 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
        HubSpot Order Sync
      </p>
    </div>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white dark:text-background"
        aria-hidden="true"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l5 5L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (state === "active") {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/50"
        aria-hidden="true"
      >
        <span className="h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse" />
      </span>
    );
  }

  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border"
      aria-hidden="true"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
    </span>
  );
}
