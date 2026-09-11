import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[350px] rounded-[2.85rem] border border-white/[0.09] bg-surface-2/95 p-[7px] shadow-[0_32px_90px_-42px_rgba(0,0,0,0.86)] ring-1 ring-black/25",
        glow && "shadow-glow",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-[15px] z-20 flex h-[22px] w-[84px] -translate-x-1/2 items-center justify-end rounded-full bg-black/94 px-2.5 shadow-sm ring-1 ring-white/[0.04]">
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
      </div>
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2.42rem] bg-black ring-1 ring-white/[0.055]">
        <div className="h-full w-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
