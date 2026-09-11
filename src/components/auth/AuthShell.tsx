import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[520px] w-[min(620px,92vw)] -translate-x-1/2 rounded-full bg-primary/16 blur-[120px]" />

      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>
        <div className="glass-panel rounded-3xl p-6 shadow-panel sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        {footer ? (
          <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
