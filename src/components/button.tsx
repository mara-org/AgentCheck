import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  dark: "bg-slate-950 text-white hover:bg-slate-800",
  secondary: "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

type ButtonVariant = keyof typeof variants;

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
