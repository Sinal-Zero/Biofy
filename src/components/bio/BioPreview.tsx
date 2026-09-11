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
  if (clean.length !== 6 && clean.length !== 8) return hex;
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
  const textScale = Math.min(1.35, Math.max(0.8, Number(theme.textScale) || 1));
  const panelWidth = Math.min(Math.max(Number(theme.width) || 480, 320), 620);
  const panelMinHeight = compact ? "660px" : "min(800px, calc(100dvh - 40px))";
  const panelMaxHeight = compact ? undefined : "min(920px, calc(100dvh - 24px))";
  const panelBorderWidth = Math.min(6, Math.max(0, Number(theme.panelBorderWidth) || 0));

  const panelBackground =
    theme.bgType === "gradient"
      ? `linear-gradient(${theme.bgAngle}deg, ${theme.bgFrom}, ${theme.bgTo})`
      : theme.bgType === "image" && theme.bgImage
        ? `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.48)), url(${theme.bgImage})`
        : theme.bgColor;

  const socials = blocks.filter((block) => block.is_visible && isSocial(block.type) && block.url);
  const mainBlocks = blocks.filter((block) => block.is_visible && !isSocial(block.type));
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
      padding: compact ? "10px 13px" : (sizePadding[theme.buttonSize] ?? sizePadding["md"]),
      boxShadow: shadow ? `0 10px 26px -14px ${withAlpha(color, 0.9)}` : "none",
      transition:
        "transform 180ms cubic-bezier(.22,1,.36,1), box-shadow 180ms ease, filter 180ms ease, background-color 180ms ease",
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
    if (anim === "scale") return "hover:scale-[1.025]";
    if (anim === "glow") return "hover:brightness-110 hover:saturate-125";
    return "";
  }

  return (
    <div
      className={cn(
        "flex min-h-full w-full justify-center overflow-x-hidden transition-colors duration-300",
        compact
          ? "items-start p-3 pt-8"
          : "min-h-dvh items-center px-4 py-5 sm:px-6 sm:py-7 lg:py-8",
        className,
      )}
      style={{ backgroundColor: theme.pageBgColor, fontFamily: fontStacks[theme.font] }}
    >
      <div
        className={cn(
          "relative w-full transform-gpu overflow-x-hidden overflow-y-auto border shadow-[0_28px_80px_-40px_rgba(0,0,0,0.76)] transition-all duration-300 motion-safe:animate-rise",
          compact ? "rounded-[1.35rem]" : "rounded-[1.85rem]",
        )}
        style={{
          maxWidth: `${panelWidth}px`,
          minHeight: panelMinHeight,
          maxHeight: panelMaxHeight,
          background: panelBackground,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderColor: theme.panelBorderColor,
          borderWidth: `${panelBorderWidth}px`,
          borderStyle: "solid",
          color: theme.textColor,
          overscrollBehavior: "contain",
        }}
      >
        <div
          className={cn(
            "mx-auto flex min-h-[inherit] w-full flex-col justify-start px-5",
            compact ? "py-8" : "px-6 py-12 sm:px-9 sm:py-14",
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
                border: theme.avatarBorder
                  ? `2px solid ${withAlpha(theme.textColor, 0.7)}`
                  : "none",
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
                border: theme.avatarBorder
                  ? `2px solid ${withAlpha(theme.textColor, 0.5)}`
                  : "none",
                fontSize: (compact ? 20 : 30) * textScale,
              }}
            >
              {initials}
            </div>
          )}

          <h1
            className="mt-3 font-semibold"
            style={{
              color: theme.textColor,
              letterSpacing: "-0.01em",
              fontSize: `${(compact ? 16 : 24) * textScale}px`,
              lineHeight: 1.2,
            }}
          >
            {displayName || (username ? `@${username}` : "Seu nome")}
          </h1>

          {username ? (
            <p className="opacity-70" style={{ fontSize: `${(compact ? 10 : 12) * textScale}px` }}>
              @{username}
            </p>
          ) : null}

          {bio ? (
            <p
              className="mt-2 max-w-full whitespace-pre-line"
              style={{
                color: theme.mutedColor,
                fontSize: `${(compact ? 11 : 14) * textScale}px`,
                lineHeight: 1.55,
              }}
            >
              {bio}
            </p>
          ) : null}

          {socials.length > 0 ? (
            <div
              className={cn("flex flex-wrap items-center gap-2", compact ? "mt-3" : "mt-5")}
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
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
                    aria-label={block.title || getBlockDef(block.type).label}
                  >
                    <Icon size={(compact ? 16 : 20) * textScale} color={theme.textColor} />
                  </El>
                );
              })}
            </div>
          ) : null}

          <div
            className="flex w-full flex-col"
            style={{
              gap: `${compact ? Math.max(7, theme.gap * 0.7) : theme.gap}px`,
              marginTop: compact ? 16 : 28,
            }}
          >
            {mainBlocks.map((block) => {
              if (block.type === "text") {
                return (
                  <p
                    key={block.id}
                    style={{
                      color: theme.mutedColor,
                      whiteSpace: "pre-line",
                      fontSize: `${(compact ? 11 : 14) * textScale}px`,
                      lineHeight: 1.55,
                    }}
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
                  <Icon size={(compact ? 14 : 18) * textScale} className="shrink-0 opacity-90" />
                  <span
                    className="min-w-0 flex-1 truncate"
                    style={{ fontSize: `${(compact ? 11 : 14) * textScale}px` }}
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
                    className={cn(
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.985]",
                      animClass(block),
                    )}
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

          {showBranding ? (
            <a
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full px-2 py-1 opacity-65 transition-all duration-200 hover:bg-white/[0.06] hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{
                color: theme.mutedColor,
                fontSize: `${(compact ? 9 : 11) * textScale}px`,
              }}
            >
              <BiofyMark className={compact ? "h-4 w-4" : "h-5 w-5"} />
              <span className="font-semibold tracking-tight">Biofy</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
