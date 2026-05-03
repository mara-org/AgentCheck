import { cn } from "@/lib/utils";
import type { AuditStatus } from "@/lib/types";

const statusClass: Record<AuditStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: AuditStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        statusClass[status],
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
