import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
}

export function LegalPage({ eyebrow, title, description, updatedAt, sections }: LegalPageProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Voltar para a página inicial">
            <Logo />
          </Link>
          <Link
            to="/"
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground sm:text-sm"
          >
            Voltar para o Biofy
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
        <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-[0.08]" />
        <article className="relative mx-auto max-w-3xl biofy-page">
          <div className="biofy-card p-5 sm:p-8 lg:p-10">
            <p className="biofy-page-kicker">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">Última atualização: {updatedAt}</p>

            <div className="mt-9 space-y-8 sm:mt-10 sm:space-y-9">
              {sections.map((section, index) => (
                <section
                  key={section.title}
                  className="scroll-mt-24 border-t border-border/60 pt-7 first:border-t-0 first:pt-0"
                >
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {index + 1}. {section.title}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-3 text-sm leading-7 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                  {section.items?.length ? (
                    <ul className="mt-3 space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
                      {section.items.map((item) => (
                        <li key={item} className="list-disc pl-1 marker:text-primary/70">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-border/70 px-4 py-7 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Biofy — Sua bio. Do seu jeito.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Termos de Uso
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
