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
        "relative mx-auto w-full max-w-phone_frame rounded-phone_frame border border-white/[0.09] bg-surface-2/95 p-7 shadow-phone_frame ring-1 ring-black/25",
        glow && "shadow-glow",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-15 z-20 flex h-22 w-84 -translate-x-1/2 items-center justify-end rounded-full bg-black/94 px-2.5 shadow-sm ring-1 ring-white/[0.04]">
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
      </div>
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-inner_frame bg-black ring-1 ring-white/[0.055]">
        <div className="no-scrollbar h-full w-full overflow-y-auto overscroll-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}