/**
 * Utility to conditionally join class names.
 * Lightweight alternative to clsx for this project's scope.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
