import { cn } from "@/shared/lib/cn";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared page width/padding wrapper. Basis: Order syncs (`max-w-6xl`).
 * Island padding lives in AppShell; this only constrains content width.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto max-w-6xl min-w-0", className)}>{children}</div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-start justify-between gap-3",
        !actions && "hidden md:block",
      )}
    >
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </header>
  );
}
