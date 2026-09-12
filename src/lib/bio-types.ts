export type BgType = "solid" | "gradient" | "image";
export type FontKey =
  | "sans"
  | "display"
  | "serif"
  | "mono"
  | "condensed"
  | "system"
  | "inter"
  | "georgia"
  | "optima"
  | "trebuchet"
  | "garamond"
  | "consolas";
export type ButtonStyle = "solid" | "outline" | "glass" | "transparent" | "gradient";
export type ButtonShape = "square" | "rounded" | "pill";
export type ButtonSize = "sm" | "md" | "lg";
export type AvatarShape = "circle" | "rounded" | "square";
export type HoverAnim = "none" | "lift" | "scale" | "glow";

export interface BioTheme {
  pageBgColor: string;
  panelBorderColor: string;
  panelBorderWidth: number;
  panelRadius?: number;
  panelPaddingX?: number;
  panelPaddingTop?: number;
  panelPaddingBottom?: number;
  panelHeight?: number;
  panelShadow?: boolean;
  panelShadowBlur?: number;
  bgType: BgType;
  bgColor: string;
  bgFrom: string;
  bgTo: string;
  bgAngle: number;
  bgImage: string;
  textColor: string;
  mutedColor: string;
  font: FontKey;
  textScale: number;
  buttonStyle: ButtonStyle;
  buttonShape: ButtonShape;
  buttonColor: string;
  buttonTextColor: string;
  buttonShadow: boolean;
  buttonSize: ButtonSize;
  buttonBorderWidth: number;
  buttonRadius?: number;
  buttonPaddingX?: number;
  buttonPaddingY?: number;
  buttonWidth?: number;
  buttonHeight?: number;
  buttonFontSize?: number;
  buttonIconSize?: number;
  gap: number;
  width: number;
  align: "left" | "center";
  avatarSize: number;
  avatarShape: AvatarShape;
  avatarBorder: boolean;
  nameFontSize?: number;
  usernameFontSize?: number;
  bioFontSize?: number;
  socialIconSize?: number;
  socialGap?: number;
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
  widthPx?: number;
  heightPx?: number;
  radiusPx?: number;
  paddingXPx?: number;
  paddingYPx?: number;
  fontSizePx?: number;
  iconSizePx?: number;
  opacity?: number;
  blockAlign?: "left" | "center" | "right" | "stretch";
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
  pageBgColor: "#08090f",
  panelBorderColor: "#ffffff1f",
  panelBorderWidth: 1,
  bgType: "gradient",
  bgColor: "#0f1020",
  bgFrom: "#111325",
  bgTo: "#2a1a4d",
  bgAngle: 160,
  bgImage: "",
  textColor: "#ffffff",
  mutedColor: "#b9bad4",
  font: "sans",
  textScale: 1,
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
  display: '"Space Grotesk", sans-serif',
  serif: '"Playfair Display", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  condensed: '"Bebas Neue", Impact, sans-serif',
  system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  georgia: 'Georgia, "Times New Roman", serif',
  optima: 'Optima, Candara, "Segoe UI", sans-serif',
  trebuchet: '"Trebuchet MS", Arial, sans-serif',
  garamond: 'Garamond, Baskerville, "Times New Roman", serif',
  consolas: 'Consolas, "Liberation Mono", ui-monospace, monospace',
};

export const fontLabels: Record<FontKey, string> = {
  sans: "Jakarta",
  display: "Space Grotesk",
  serif: "Playfair",
  mono: "JetBrains Mono",
  condensed: "Bebas Neue",
  system: "System UI",
  inter: "Inter",
  georgia: "Georgia",
  optima: "Optima",
  trebuchet: "Trebuchet",
  garamond: "Garamond",
  consolas: "Consolas",
};
