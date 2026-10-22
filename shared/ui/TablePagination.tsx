"use client";

import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

type TablePaginationProps = {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** Left-side meta, e.g. "Showing 5 of 12 contacts". */
  meta?: string;
  /** Centered between meta and pagination buttons when present. */
  trailingMeta?: string;
  className?: string;
};

export function TablePagination({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  meta,
  trailingMeta,
  className,
}: TablePaginationProps) {
  const showBar =
    hasPrevious || hasNext || meta || trailingMeta;
  if (!showBar) return null;

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border bg-surface-subtle px-4 py-3",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {meta ? (
          <p className="shrink-0 text-sm text-muted-foreground">{meta}</p>
        ) : (
          <span className="hidden sm:block sm:w-0 sm:shrink-0" aria-hidden />
        )}

        {trailingMeta ? (
          <p className="text-center text-sm text-muted-foreground sm:min-w-0 sm:flex-1 sm:px-2">
            {trailingMeta}
          </p>
        ) : (
          <span className="hidden sm:block sm:min-w-0 sm:flex-1" aria-hidden />
        )}

        <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-disabled={!hasPrevious}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
            aria-disabled={!hasNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
