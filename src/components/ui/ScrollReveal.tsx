import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "visible">("idle");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setState("visible");
      return;
    }

    const rect = node.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.94) {
      setState("visible");
      return;
    }

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setState("visible");
        observer.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const safeDelay = Math.max(0, Math.min(delay, 180));

  return (
    <div
      ref={ref}
      className={cn(
        "transform-gpu transition-[opacity,transform] duration-[380ms] ease-[cubic-bezier(.16,1,.3,1)]",
        state === "hidden" && "translate-y-2 opacity-0 will-change-transform",
        state !== "hidden" && "translate-y-0 opacity-100",
        className,
      )}
      style={state === "visible" && safeDelay ? { transitionDelay: `${safeDelay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
