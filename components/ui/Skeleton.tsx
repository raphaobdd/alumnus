import { cn } from "./cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-[var(--radius-sm)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
