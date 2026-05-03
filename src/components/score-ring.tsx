import { cn } from "@/lib/utils";

export function ScoreRing({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color =
    clamped >= 80 ? "#0f9f6e" : clamped >= 60 ? "#d97706" : "#dc2626";
  const dimension = size === "lg" ? "h-32 w-32 text-3xl" : "h-16 w-16 text-base";

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold text-slate-950",
        dimension,
      )}
      style={{
        background: `conic-gradient(${color} ${clamped * 3.6}deg, #e5e7eb 0deg)`,
      }}
    >
      <div className="grid h-[78%] w-[78%] place-items-center rounded-full bg-white">
        {clamped}
      </div>
    </div>
  );
}
