import { cn } from "@/lib/utils";

export function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <div
      className={cn("absolute", className)}
      style={{ rotate: `${rotate}deg` }}
    >
      {/* Entrance fade */}
      <div style={{ width, height, animation: `shape-in 1.2s ease-out ${delay}s both` }}>
        {/* Continuous float */}
        <div
          style={{
            width: '100%',
            height: '100%',
            animation: `shape-float 12s ease-in-out ${delay}s infinite`,
          }}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              "bg-gradient-to-r to-transparent",
              gradient,
              "border border-[#F9C125]/[0.12]",
              "shadow-[0_8px_32px_0_rgba(249,193,37,0.08)]",
              "after:absolute after:inset-0 after:rounded-full",
              "after:bg-[radial-gradient(circle_at_50%_50%,rgba(249,193,37,0.12),transparent_70%)]"
            )}
          />
        </div>
      </div>
    </div>
  );
}
