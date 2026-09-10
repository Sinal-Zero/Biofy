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
        "relative mx-auto w-full max-w-[360px] rounded-[3rem] border border-border/80 bg-surface-2 p-[9px] shadow-2xl",
        glow && "shadow-glow",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-[17px] z-20 flex h-[24px] w-[92px] -translate-x-1/2 items-center justify-end rounded-full bg-black/90 px-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
      </div>
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2.45rem] bg-black ring-1 ring-white/5">
        <div className="no-scrollbar h-full w-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
