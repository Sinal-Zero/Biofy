import { useMemo } from "react";
import { BiofyMark } from "@/components/brand/Logo";
import { fontStacks, mergeTheme, type BioBlock, type BioTheme } from "@/lib/bio-types";
import { getBlockDef, isSocial } from "@/lib/blocks";
import { cn } from "@/lib/utils";

export interface BioPreviewProps {
  displayName: string | null | undefined;
  username: string | null | undefined;
  bio: string | null | undefined;
  avatarUrl: string | null | undefined;
  theme: Partial<BioTheme> | null | undefined;
  blocks: BioBlock[];
  showBranding?: boolean;
  interactive?: boolean;
  compact?: boolean;
  onBlockClick?: (block: BioBlock) => void;
  className?: string;
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const shapeRadius: Record<string, string> = {
  square: "6px",
  rounded: "14px",
  pill: "999px",
};

const sizePadding: Record<string, string> = {
  sm: "10px 14px",
  md: "14px 18px",
  lg: "18px 22px",
};

export function BioPreview({
  displayName,
  username,
  bio,
  avatarUrl,
  theme: rawTheme,
  blocks,
  showBranding = true,
  interactive = false,
  compact = false,
  onBlockClick,
  className,
}: BioPreviewProps) {
  const theme = useMemo(() => mergeTheme(rawTheme), [rawTheme]);

  const panelBackground =
    theme.bgType === "gradient"
      ? `linear-gradient(${theme.bgAngle}deg, ${theme.bgFrom}, ${theme.bgTo})`
      : theme.bgType === "image" && theme.bgImage
        ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url(${theme.bgImage})`
        : theme.bgColor;

  const socials = blocks.filter((b) => b.is_visible && isSocial(b.type) && b.url);
  const mainBlocks = blocks.filter((b) => b.is_visible && !isSocial(b.type));

  const avatarRadius =
    theme.avatarShape === "circle" ? "999px" : theme.avatarShape === "rounded" ? "18px" : "4px";

  const initials = (displayName || username || "B").trim().charAt(0).toUpperCase();

  function buttonStyleFor(block: BioBlock) {
    const cfg = block.config ?? {};
    const style =
      !cfg.buttonStyle || cfg.buttonStyle === "inherit" ? theme.buttonStyle : cfg.buttonStyle;
    const shape =
      !cfg.buttonShape || cfg.buttonShape === "inherit" ? theme.buttonShape : cfg.buttonShape;
    const color = cfg.buttonColor || theme.buttonColor;
    const textColor = cfg.buttonTextColor || theme.buttonTextColor;
    const shadow = cfg.buttonShadow ?? theme.buttonShadow;

    const base: React.CSSProperties = {
      borderRadius: shapeRadius[shape] ?? "14px",
      padding: compact ? "9px 12px" : (sizePadding[theme.buttonSize] ?? sizePadding["md"]),
      boxShadow: shadow ? `0 10px 26px -14px ${withAlpha(color, 0.9)}` : "none",
      transition: "transform 180ms cubic-bezier(.22,1,.36,1), box-shadow 180ms, filter 180ms",
      border: "1px solid transparent",
      width: "100%",
      textAlign: "center",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: theme.align === "left" ? "flex-start" : "center",
      gap: "10px",
    };

    switch (style) {
      case "solid":
        return { ...base, background: color, color: textColor };
      case "outline":
        return {
          ...base,
          background: "transparent",
          color: textColor,
          border: `${theme.buttonBorderWidth}px solid ${color}`,
        };
      case "glass":
        return {
          ...base,
          background: withAlpha(color, 0.14),
          color: textColor,
          border: `1px solid ${withAlpha(color, 0.28)}`,
          backdropFilter: "blur(12px)",
        };
      case "transparent":
        return { ...base, background: "transparent", color: textColor, boxShadow: "none" };
      case "gradient":
        return {
          ...base,
          background: `linear-gradient(120deg, ${color}, ${withAlpha(color, 0.45)})`,
          color: textColor,
        };
      default:
        return { ...base, background: color, color: textColor };
    }
  }

  function animClass(block: BioBlock) {
    const cfg = block.config ?? {};
    const anim = !cfg.animation || cfg.animation === "inherit" ? theme.hoverAnim : cfg.animation;
    if (anim === "lift") return "hover:-translate-y-1";
    if (anim === "scale") return "hover:scale-[1.03]";
    if (anim === "glow") return "hover:brightness-125 hover:saturate-150";
    return "";
  }

  return (
    <div
      className={cn(
        "flex min-h-full w-full items-start justify-center transition-colors duration-300",
        compact ? "p-3" : "min-h-screen p-4 sm:p-8 lg:p-12",
        className,
      )}
      style={{ backgroundColor: theme.pageBgColor, fontFamily: fontStacks[theme.font] }}
    >
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden border shadow-[0_28px_90px_-46px_rgba(0,0,0,0.78)] transition-all duration-300",
          compact ? "min-h-full rounded-[1.25rem]" : "min-h-[calc(100vh-2rem)] rounded-[1.75rem] sm:min-h-[calc(100vh-4rem)]",
        )}
        style={{
          maxWidth: `${theme.width}px`,
          background: panelBackground,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderColor: theme.panelBorderColor,
          color: theme.textColor,
        }}
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col px-5",
            compact ? "py-7" : "py-10 sm:px-8 sm:py-14",
            theme.align === "left" ? "items-start text-left" : "items-center text-center",
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || username || "avatar"}
              style={{
                width: compact ? theme.avatarSize * 0.7 : theme.avatarSize,
                height: compact ? theme.avatarSize * 0.7 : theme.avatarSize,
                borderRadius: avatarRadius,
                objectFit: "cover",
                border: theme.avatarBorder ? `2px solid ${withAlpha(theme.textColor, 0.7)}` : "none",
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center font-semibold"
              style={{
                width: compact ? theme.avatarSize * 0.7 : theme.avatarSize,
                height: compact ? theme.avatarSize * 0.7 : theme.avatarSize,
                borderRadius: avatarRadius,
                background: withAlpha(theme.textColor, 0.14),
                border: theme.avatarBorder ? `2px solid ${withAlpha(theme.textColor, 0.5)}` : "none",
                fontSize: compact ? 20 : 30,
              }}
            >
              {initials}
            </div>
          )}

          <h1
            className={cn("font-semibold", compact ? "mt-3 text-base" : "mt-4 text-2xl")}
            style={{ color: theme.textColor, letterSpacing: "-0.01em" }}
          >
            {displayName || (username ? `@${username}` : "Seu nome")}
          </h1>
          {username && (
            <p className={compact ? "text-[10px] opacity-70" : "text-xs opacity-70"}>@{username}</p>
          )}
          {bio && (
            <p
              className={cn(
                "max-w-full whitespace-pre-line",
                compact ? "mt-2 text-[11px]" : "mt-3 text-sm",
              )}
              style={{ color: theme.mutedColor }}
            >
              {bio}
            </p>
          )}

          {socials.length > 0 && (
            <div
              className={cn("flex flex-wrap items-center gap-3", compact ? "mt-3" : "mt-5")}
              style={{ justifyContent: theme.align === "left" ? "flex-start" : "center" }}
            >
              {socials.map((block) => {
                const Icon = getBlockDef(block.type).icon;
                const El = interactive ? "a" : "div";
                return (
                  <El
                    key={block.id}
                    {...(interactive
                      ? {
                          href: block.url ?? "#",
                          target: "_blank",
                          rel: "noreferrer noopener",
                          onClick: () => onBlockClick?.(block),
                        }
                      : {})}
                    className="transition-transform duration-200 hover:-translate-y-0.5 hover:opacity-80"
                    aria-label={block.title || getBlockDef(block.type).label}
                  >
                    <Icon size={compact ? 16 : 22} color={theme.textColor} />
                  </El>
                );
              })}
            </div>
          )}

          <div
            className="flex w-full flex-col"
            style={{
              gap: `${compact ? Math.max(6, theme.gap * 0.7) : theme.gap}px`,
              marginTop: compact ? 14 : 26,
            }}
          >
            {mainBlocks.map((block) => {
              if (block.type === "text") {
                return (
                  <p
                    key={block.id}
                    className={compact ? "text-[11px]" : "text-sm"}
                    style={{ color: theme.mutedColor, whiteSpace: "pre-line" }}
                  >
                    {block.config?.text || block.title || "Seu texto aqui"}
                  </p>
                );
              }
              if (block.type === "image") {
                const src = block.config?.imageUrl || block.url;
                if (!src) return null;
                return (
                  <img
                    key={block.id}
                    src={src}
                    alt={block.title || "Imagem"}
                    className="w-full object-cover"
                    style={{ borderRadius: shapeRadius[theme.buttonShape] ?? "14px" }}
                    loading="lazy"
                  />
                );
              }
              const Icon = getBlockDef(block.type).icon;
              const content = (
                <>
                  <Icon size={compact ? 14 : 18} className="shrink-0 opacity-90" />
                  <span
                    className={cn("min-w-0 flex-1 truncate", compact ? "text-[11px]" : "text-sm")}
                  >
                    {block.title || "Novo link"}
                  </span>
                </>
              );
              if (interactive && block.url) {
                return (
                  <a
                    key={block.id}
                    href={block.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => onBlockClick?.(block)}
                    style={buttonStyleFor(block)}
                    className={animClass(block)}
                  >
                    {content}
                  </a>
                );
              }
              return (
                <div key={block.id} style={buttonStyleFor(block)} className={animClass(block)}>
                  {content}
                </div>
              );
            })}
          </div>

          {showBranding && (
            <a
              href="/"
              className={cn(
                "mt-auto inline-flex items-center gap-2 pt-10 opacity-70 transition-all hover:opacity-100",
                compact ? "text-[9px]" : "text-[11px]",
              )}
              style={{ color: theme.mutedColor }}
            >
              <BiofyMark className={compact ? "h-4 w-4" : "h-5 w-5"} />
              <span className="font-semibold tracking-tight">Biofy</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
