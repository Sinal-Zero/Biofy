import {
  Instagram,
  Youtube,
  Music2,
  MessageCircle,
  Send,
  Linkedin,
  Mail,
  Globe,
  Link as LinkIcon,
  Type,
  Image as ImageIcon,
  Disc3,
  Hash,
  type LucideIcon,
} from "lucide-react";

export interface BlockTypeDef {
  type: string;
  label: string;
  icon: LucideIcon;
  social: boolean;
  placeholder?: string;
  color: string;
}

export const blockTypes: BlockTypeDef[] = [
  {
    type: "link",
    label: "Link",
    icon: LinkIcon,
    social: false,
    placeholder: "https://",
    color: "#6d7bff",
  },
  { type: "text", label: "Texto", icon: Type, social: false, color: "#8b8fa8" },
  { type: "image", label: "Imagem", icon: ImageIcon, social: false, color: "#9b6dff" },
  {
    type: "instagram",
    label: "Instagram",
    icon: Instagram,
    social: true,
    placeholder: "https://instagram.com/",
    color: "#e1306c",
  },
  {
    type: "tiktok",
    label: "TikTok",
    icon: Music2,
    social: true,
    placeholder: "https://tiktok.com/@",
    color: "#25f4ee",
  },
  {
    type: "youtube",
    label: "YouTube",
    icon: Youtube,
    social: true,
    placeholder: "https://youtube.com/@",
    color: "#ff0033",
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    social: true,
    placeholder: "https://wa.me/55",
    color: "#25d366",
  },
  {
    type: "spotify",
    label: "Spotify",
    icon: Disc3,
    social: true,
    placeholder: "https://open.spotify.com/",
    color: "#1db954",
  },
  {
    type: "telegram",
    label: "Telegram",
    icon: Send,
    social: true,
    placeholder: "https://t.me/",
    color: "#2aabee",
  },
  {
    type: "discord",
    label: "Discord",
    icon: Hash,
    social: true,
    placeholder: "https://discord.gg/",
    color: "#5865f2",
  },
  {
    type: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    social: true,
    placeholder: "https://linkedin.com/in/",
    color: "#0a66c2",
  },
  {
    type: "x",
    label: "X",
    icon: Hash,
    social: true,
    placeholder: "https://x.com/",
    color: "#ffffff",
  },
  {
    type: "email",
    label: "E-mail",
    icon: Mail,
    social: true,
    placeholder: "mailto:voce@email.com",
    color: "#ffb020",
  },
  {
    type: "website",
    label: "Site",
    icon: Globe,
    social: true,
    placeholder: "https://",
    color: "#7dd3fc",
  },
];

export const blockTypeMap: Record<string, BlockTypeDef> = Object.fromEntries(
  blockTypes.map((b) => [b.type, b]),
);

export function getBlockDef(type: string): BlockTypeDef {
  return blockTypeMap[type] ?? blockTypes[0]!;
}

export function isSocial(type: string): boolean {
  return getBlockDef(type).social;
}

export function normalizeUrl(type: string, raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (type === "email") {
    return value.startsWith("mailto:") ? value : `mailto:${value}`;
  }
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return `https://${value}`;
}

export function detectLinkType(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!value) return "link";

  if (value.startsWith("mailto:")) return "email";

  const normalized = /^(https?:\/\/)/i.test(value) ? value : `https://${value}`;

  try {
    const host = new URL(normalized).hostname.replace(/^www\./, "");

    if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
    if (host === "open.spotify.com" || host === "spotify.com" || host.endsWith(".spotify.com"))
      return "spotify";
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be")
      return "youtube";
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
    if (
      host === "wa.me" ||
      host === "whatsapp.com" ||
      host.endsWith(".whatsapp.com")
    )
      return "whatsapp";
    if (host === "t.me" || host === "telegram.me") return "telegram";
    if (host === "discord.gg" || host === "discord.com" || host.endsWith(".discord.com"))
      return "discord";
    if (host === "linkedin.com" || host.endsWith(".linkedin.com")) return "linkedin";
    if (host === "x.com" || host === "twitter.com" || host.endsWith(".twitter.com")) return "x";

    return "website";
  } catch {
    return "link";
  }
}

export function createWhatsAppUrl(countryCode: string, areaCode: string, number: string): string {
  const country = countryCode.replace(/\D/g, "");
  const area = areaCode.replace(/\D/g, "");
  const local = number.replace(/\D/g, "");
  if (!country || !area || !local) return "";
  return `https://wa.me/${country}${area}${local}`;
}
