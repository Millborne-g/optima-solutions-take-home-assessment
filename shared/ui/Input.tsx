import { cn } from "@/shared/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={!!error}
      className={cn(
        "block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-1 focus:ring-offset-background",
        error && "border-danger focus:ring-danger",
        "disabled:bg-surface-subtle disabled:text-muted-foreground",
        className,
      )}
    />
  );
}
