import { cn } from "@/shared/lib/cn";

type AvatarInitialsProps = {
  name?: string | null;
  email?: string | null;
  className?: string;
};

function initialsFrom(name?: string | null, email?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return "?";
}

export function AvatarInitials({
  name,
  email,
  className,
}: AvatarInitialsProps) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        "bg-primary/15 text-xs font-semibold text-primary",
        className,
      )}
      aria-hidden="true"
    >
      {initialsFrom(name, email)}
    </span>
  );
}
