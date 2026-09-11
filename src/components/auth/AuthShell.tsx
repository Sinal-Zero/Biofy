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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-[0.18]" />
      <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[560px] w-[min(680px,96vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-[135px]" />

      <div className="relative w-full max-w-[430px] biofy-page">
        <div className="mb-6 flex justify-center sm:mb-7">
          <Logo />
        </div>
        <div className="biofy-card p-5 sm:p-7 md:p-8">
          <div className="max-w-sm">
            <h1 className="text-2xl font-bold leading-tight sm:text-[1.7rem]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
          <div className="mt-6">{children}</div>
        </div>
        {footer ? (
          <div className="mt-5 px-2 text-center text-sm leading-6 text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}
