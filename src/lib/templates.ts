import { defaultTheme, type BioTheme } from "./bio-types";

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  theme: BioTheme;
}

function t(partial: Partial<BioTheme>): BioTheme {
  return { ...defaultTheme, ...partial };
}

export const templates: TemplateDef[] = [
  {
    id: "minimal",
    name: "Claro",
    description: "Visual limpo, claro e direto.",
    theme: t({
      bgType: "solid",
      bgColor: "#f7f7f8",
      textColor: "#15151a",
      mutedColor: "#6f7078",
      font: "sans",
      buttonStyle: "outline",
      buttonShape: "rounded",
      buttonColor: "#15151a",
      buttonTextColor: "#15151a",
      buttonShadow: false,
      avatarBorder: false,
      hoverAnim: "lift",
    }),
  },
  {
    id: "dark",
    name: "Preto",
    description: "Contraste alto e aparência minimalista.",
    theme: t({
      bgType: "solid",
      bgColor: "#09090b",
      textColor: "#f7f7f8",
      mutedColor: "#a0a0aa",
      font: "sans",
      buttonStyle: "outline",
      buttonShape: "rounded",
      buttonColor: "#f7f7f8",
      buttonTextColor: "#f7f7f8",
      buttonShadow: false,
      avatarBorder: false,
      hoverAnim: "lift",
    }),
  },
  {
    id: "gray",
    name: "Cinza",
    description: "Neutro, equilibrado e moderno.",
    theme: t({
      bgType: "solid",
      bgColor: "#d9d9de",
      textColor: "#232329",
      mutedColor: "#65656f",
      font: "sans",
      buttonStyle: "solid",
      buttonShape: "rounded",
      buttonColor: "#3f3f46",
      buttonTextColor: "#ffffff",
      buttonShadow: false,
      avatarBorder: false,
      hoverAnim: "lift",
    }),
  },
];

export const templateMap: Record<string, TemplateDef> = Object.fromEntries(
  templates.map((tpl) => [tpl.id, tpl]),
);

export function getTemplate(id: string | null | undefined): TemplateDef {
  return (id && templateMap[id]) || templates[0]!;
}
