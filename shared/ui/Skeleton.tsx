import { cn } from "@/shared/lib/cn";
import { PageContainer } from "@/shared/ui/PageContainer";

type SkeletonProps = {
  className?: string;
};

/** Pulsing placeholder bar. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-subtle motion-reduce:animate-none",
        className,
      )}
      aria-hidden="true"
    />
  );
}

function PageHeaderSkeleton({ actionWidth = "w-40" }: { actionWidth?: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="hidden md:block">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <Skeleton className={cn("h-10 w-full sm:w-auto", actionWidth)} />
    </header>
  );
}

function ContactRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3 max-w-[10rem]" />
        <Skeleton className="h-3 w-1/2 max-w-[14rem] md:hidden" />
      </div>
      <Skeleton className="hidden h-4 w-40 md:block" />
      <Skeleton className="hidden h-4 w-28 md:block" />
      <Skeleton className="h-4 w-12 shrink-0" />
    </div>
  );
}

function ContactCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="mt-4 flex justify-end">
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

/** Contacts list loading UI — cards on mobile, table rows on md+. */
export function ContactsPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading contacts">
      <PageContainer>
        <PageHeaderSkeleton actionWidth="sm:w-72" />
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <ContactCardSkeleton key={i} />
          ))}
        </div>
        <div className="hidden min-w-0 overflow-hidden rounded-xl border border-border bg-surface shadow-sm md:block">
          <div className="border-b border-border bg-surface-subtle px-4 py-3">
            <div className="flex gap-8">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <ContactRowSkeleton key={i} />
          ))}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        </div>
        <span className="sr-only">Loading contacts…</span>
      </PageContainer>
    </div>
  );
}

function SyncCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
}

function SyncRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <Skeleton className="h-4 w-28 shrink-0" />
      <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-36 shrink-0" />
      <Skeleton className="h-3 w-20 shrink-0" />
      <Skeleton className="h-3 w-20 shrink-0" />
      <Skeleton className="h-4 min-w-0 flex-1" />
      <Skeleton className="h-8 w-16 shrink-0" />
    </div>
  );
}

/** Order syncs list loading UI — cards on mobile, table rows on md+. */
export function SyncsPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading syncs">
      <PageContainer>
        <PageHeaderSkeleton actionWidth="sm:w-56" />
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <SyncCardSkeleton key={i} />
          ))}
        </div>
        <div className="hidden min-w-0 overflow-hidden rounded-xl border border-border bg-surface shadow-sm md:block">
          <div className="border-b border-border bg-surface-subtle px-4 py-3">
            <div className="flex gap-6">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <SyncRowSkeleton key={i} />
          ))}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Skeleton className="h-4 w-44" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        </div>
        <span className="sr-only">Loading syncs…</span>
      </PageContainer>
    </div>
  );
}
