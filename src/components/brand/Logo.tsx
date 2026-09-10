import { Link } from "@tanstack/react-router";
import mark from "@/assets/biofy-mark.png";
import { cn } from "@/lib/utils";

export function BiofyMark({ className }: { className?: string }) {
  return (
    <img
      src={mark}
      alt="Biofy"
      width={816}
      height={816}
      className={cn("h-8 w-8 object-contain", className)}
    />
  );
}

export function Logo({
  className,
  showWordmark = true,
  to = "/",
}: {
  className?: string;
  showWordmark?: boolean;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className={cn("group flex items-center gap-2.5 outline-none", className)}
      aria-label="Biofy"
    >
      <BiofyMark className="h-8 w-8 transition-transform duration-300 group-hover:rotate-6" />
      {showWordmark && (
        <span className="font-display text-xl font-bold tracking-tight text-foreground">Biofy</span>
      )}
    </Link>
  );
}
