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
        "relative mx-auto w-full max-w-[360px] rounded-[3rem] border border-white/10 bg-surface-2/95 p-[8px] shadow-2xl ring-1 ring-black/20 transition-transform duration-500",
        glow && "shadow-glow",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-[16px] z-20 flex h-[23px] w-[88px] -translate-x-1/2 items-center justify-end rounded-full bg-black/92 px-2.5 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
      </div>
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2.5rem] bg-black ring-1 ring-white/[0.06]">
        <div className="no-scrollbar h-full w-full overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
