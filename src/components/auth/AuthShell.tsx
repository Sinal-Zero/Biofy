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
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-[420px] biofy-page">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>

        <div className="biofy-card p-5 sm:p-7">
          <div className="max-w-sm">
            <h1 className="text-2xl font-bold leading-tight tracking-[-0.035em] sm:text-[1.7rem]">
              {title}
            </h1>
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
