export type BgType = "solid" | "gradient" | "image";
export type FontKey =
  | "sans"
  | "display"
  | "serif"
  | "mono"
  | "condensed"
  | "system"
  | "modern"
  | "classic"
  | "humanist"
  | "rounded"
  | "editorial"
  | "technical";
export type ButtonStyle = "solid" | "outline" | "glass" | "transparent" | "gradient";
export type ButtonShape = "square" | "rounded" | "pill";
export type ButtonSize = "sm" | "md" | "lg";
export type AvatarShape = "circle" | "rounded" | "square";
export type HoverAnim = "none" | "lift" | "scale" | "glow";

export interface BioTheme {
  bgType: BgType;
  bgColor: string;
  bgFrom: string;
  bgTo: string;
  bgAngle: number;
  bgImage: string;
  textColor: string;
  mutedColor: string;
  font: FontKey;
  buttonStyle: ButtonStyle;
  buttonShape: ButtonShape;
  buttonColor: string;
  buttonTextColor: string;
  buttonShadow: boolean;
  buttonSize: ButtonSize;
  buttonBorderWidth: number;
  gap: number;
  width: number;
  align: "left" | "center";
  avatarSize: number;
  avatarShape: AvatarShape;
  avatarBorder: boolean;
  hoverAnim: HoverAnim;
}

export interface BlockConfig {
  icon?: string;
  text?: string;
  imageUrl?: string;
  buttonStyle?: ButtonStyle | "inherit";
  buttonColor?: string;
  buttonTextColor?: string;
  buttonShape?: ButtonShape | "inherit";
  buttonShadow?: boolean;
  animation?: HoverAnim | "inherit";
  countryCode?: string;
  areaCode?: string;
  phoneNumber?: string;
}

export interface BioBlock {
  id: string;
  page_id: string;
  type: string;
  title: string | null;
  url: string | null;
  config: BlockConfig;
  position: number;
  is_visible: boolean;
}

export interface BioProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface BioPage {
  id: string;
  user_id: string;
  username: string | null;
  template: string;
  theme: Partial<BioTheme>;
  is_published: boolean;
  published_at: string | null;
}

export const defaultTheme: BioTheme = {
  bgType: "gradient",
  bgColor: "#0f1020",
  bgFrom: "#111325",
  bgTo: "#2a1a4d",
  bgAngle: 160,
  bgImage: "",
  textColor: "#ffffff",
  mutedColor: "#b9bad4",
  font: "sans",
  buttonStyle: "glass",
  buttonShape: "rounded",
  buttonColor: "#ffffff",
  buttonTextColor: "#ffffff",
  buttonShadow: true,
  buttonSize: "md",
  buttonBorderWidth: 1,
  gap: 12,
  width: 480,
  align: "center",
  avatarSize: 92,
  avatarShape: "circle",
  avatarBorder: true,
  hoverAnim: "lift",
};

export function mergeTheme(theme: Partial<BioTheme> | null | undefined): BioTheme {
  return { ...defaultTheme, ...(theme ?? {}) };
}

export const fontStacks: Record<FontKey, string> = {
  sans: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  display: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  serif: '"Playfair Display", Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
  condensed: '"Bebas Neue", Impact, "Arial Narrow", sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  modern: 'Inter, ui-sans-serif, system-ui, sans-serif',
  classic: 'Georgia, "Times New Roman", Times, serif',
  humanist: 'Optima, Candara, "Segoe UI", sans-serif',
  rounded: '"Trebuchet MS", "Arial Rounded MT Bold", ui-sans-serif, sans-serif',
  editorial: 'Garamond, Baskerville, "Times New Roman", serif',
  technical: 'Consolas, "Liberation Mono", "Courier New", monospace',
};

export const fontLabels: Record<FontKey, string> = {
  sans: "Jakarta",
  display: "Space Grotesk",
  serif: "Playfair",
  mono: "JetBrains Mono",
  condensed: "Bebas Neue",
  system: "System UI",
  modern: "Inter",
  classic: "Georgia",
  humanist: "Optima",
  rounded: "Trebuchet",
  editorial: "Garamond",
  technical: "Consolas",
};
