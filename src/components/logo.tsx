import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  markClassName,
  textClassName,
}: {
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <Link className={cn("flex items-center gap-2.5 font-bold", className)} href={href}>
      <span
        className={cn(
          "grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/10",
          markClassName,
        )}
      >
        <Image
          src="/agentcheck-logo.png"
          alt=""
          width={36}
          height={36}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      <span className={cn("text-sm", textClassName)}>AgentCheck</span>
    </Link>
  );
}
