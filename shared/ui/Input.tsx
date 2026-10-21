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
        "block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
        "placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-offset-1",
        error
          ? "border-red-400 focus:ring-red-400"
          : "border-gray-300 focus:ring-blue-500",
        "disabled:bg-gray-50 disabled:text-gray-500",
        className,
      )}
    />
  );
}
