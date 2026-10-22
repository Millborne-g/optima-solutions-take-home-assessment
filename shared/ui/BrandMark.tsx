import { cn } from "@/shared/lib/cn";

type BrandMarkProps = {
  size?: "sm" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    box: "h-9 w-9 rounded-lg",
    icon: "h-4 w-4",
  },
  lg: {
    box: "h-14 w-14 rounded-xl",
    icon: "h-7 w-7",
  },
};

export function BrandMark({ size = "sm", className }: BrandMarkProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
        sizes.box,
        className,
      )}
      aria-hidden="true"
    >
      <svg className={sizes.icon} viewBox="0 0 24 24" fill="none">
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
