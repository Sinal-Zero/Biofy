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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Voltar para a página inicial">
            <Logo />
          </Link>
          <Link to="/" className="text-sm text-muted-foreground transition hover:text-foreground">
            Voltar para o Biofy
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10">
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
            <p className="mt-4 text-xs text-muted-foreground">Última atualização: {updatedAt}</p>

            <div className="mt-10 space-y-9">
              {sections.map((section, index) => (
                <section key={section.title} className="scroll-mt-24">
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
                        <li key={item} className="list-disc pl-1">
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

      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Biofy — Sua bio. Do seu jeito.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="transition hover:text-foreground">
              Termos de Uso
            </Link>
            <Link to="/privacy" className="transition hover:text-foreground">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
