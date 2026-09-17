import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const update = () => {
      const viewportHeight = viewport.clientHeight;
      const contentHeight = content.scrollHeight;
      if (!viewportHeight || !contentHeight) return;
      setScale(Math.min(1, viewportHeight / contentHeight));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-phone_frame rounded-phone_frame border border-white/[0.09] bg-surface-2/95 p-7 shadow-phone_frame ring-1 ring-black/25",
        glow && "shadow-glow",
        className,
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-2 z-20 flex h-6 w-[84px] -translate-x-1/2 items-center justify-center rounded-full bg-black/94 px-2 shadow-sm ring-1 ring-white/[0.04]">
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
      </div>
      <div
        ref={viewportRef}
        className="relative aspect-[9/19] w-full overflow-hidden rounded-inner_frame bg-black ring-1 ring-white/[0.055]"
      >
        <div
          ref={contentRef}
          className="pointer-events-none origin-top"
          style={{ width: `${100 / scale}%`, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}