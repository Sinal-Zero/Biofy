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
