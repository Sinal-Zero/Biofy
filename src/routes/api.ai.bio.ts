import { createFileRoute } from "@tanstack/react-router";
import { buildBiofyAiPrompt } from "@/lib/biofy-ai-prompt";
import type { BioTheme } from "@/lib/bio-types";

const GEMINI_TIMEOUT_MS = 25000;
const INTERACTIONS_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

const LEGACY_MODEL_PRIORITY = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

const ALLOWED_BLOCK_TYPES = new Set([
  "link",
  "instagram",
  "tiktok",
  "youtube",
  "whatsapp",
  "spotify",
  "telegram",
  "discord",
  "linkedin",
  "x",
  "email",
  "website",
]);

const COLOR_FIELDS = new Set([
  "pageBgColor",
  "panelBorderColor",
  "bgColor",
  "bgFrom",
  "bgTo",
  "textColor",
  "mutedColor",
  "buttonColor",
  "buttonTextColor",
]);

const BOOLEAN_FIELDS = new Set(["buttonShadow", "avatarBorder"]);

const NUMBER_LIMITS: Record<string, [number, number]> = {
  panelBorderWidth: [0, 8],
  bgAngle: [0, 360],
  textScale: [0.8, 1.35],
  buttonBorderWidth: [0, 8],
  gap: [0, 40],
  width: [300, 760],
  avatarSize: [40, 180],
};

const ENUM_FIELDS: Record<string, readonly string[]> = {
  bgType: ["solid", "gradient", "image"],
  font: [
    "sans",
    "display",
    "serif",
    "mono",
    "condensed",
    "system",
    "inter",
    "georgia",
    "optima",
    "trebuchet",
    "garamond",
    "consolas",
  ],
  buttonStyle: ["solid", "outline", "glass", "transparent", "gradient"],
  buttonShape: ["square", "rounded", "pill"],
  buttonSize: ["sm", "md", "lg"],
  align: ["left", "center"],
  avatarShape: ["circle", "rounded", "square"],
  hoverAnim: ["none", "lift", "scale", "glow"],
};

type GeminiAttempt = {
  response?: Response;
  detail: string;
  status: number;
  timedOut: boolean;
  model: string;
  api: "interactions" | "generateContent" | "models.list";
};

type GeminiSuccess = {
  response: Response;
  model: string;
  api: "interactions" | "generateContent";
};

type CurrentBlock = {
  id: string;
  title: string;
  type: string;
  isVisible: boolean;
  position: number;
};

type SanitizedAgentResponse = {
  message: string;
  bio: string;
  linkTitles: Array<{ id: string; title: string }>;
  profile: { displayName?: string };
  theme: Partial<BioTheme>;
  blocks: Array<{ id: string; title?: string; url?: string | null; isVisible?: boolean }>;
  order: string[];
  removeBlockIds: string[];
  duplicateBlockIds: string[];
  addBlocks: Array<{ type: string; title?: string | null; url?: string | null }>;
  tips: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanGeminiDetail(detail: string) {
  return detail
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted]")
    .replace(/AQ\.[0-9A-Za-z._-]{20,}/g, "[redacted]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[redacted-email]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
}

async function readGeminiError(response: Response) {
  const raw = await response.text();
  let detail = raw;

  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; status?: string } };
    detail = [parsed.error?.status, parsed.error?.message].filter(Boolean).join(": ") || raw;
  } catch {
    // Keep Google's plain-text response after redaction.
  }

  return cleanGeminiDetail(detail);
}

function mapGeminiError(attempt: GeminiAttempt) {
  const normalized = attempt.detail.toLowerCase();

  if (attempt.timedOut) return "O Gemini demorou demais para responder. Tente novamente.";

  if (
    attempt.status === 429 ||
    normalized.includes("quota") ||
    normalized.includes("resource_exhausted")
  ) {
    return "A cota do Gemini foi atingida. Tente novamente em alguns minutos.";
  }

  if (
    attempt.status === 401 ||
    attempt.status === 403 ||
    normalized.includes("permission_denied") ||
    normalized.includes("unauthenticated") ||
    normalized.includes("api key") ||
    normalized.includes("api_key") ||
    normalized.includes("key not valid") ||
    normalized.includes("standard key") ||
    normalized.includes("unrestricted key")
  ) {
    return "A Gemini API recusou a autenticação. Confirme no Google AI Studio se a GEMINI_API_KEY é uma chave Auth válida para a Gemini API.";
  }

  if (normalized.includes("location") && normalized.includes("not supported")) {
    return "O Google informou que a localização do projeto não é compatível com a Gemini API.";
  }

  if (attempt.status === 404) {
    return "O projeto Gemini não expôs nenhum modelo compatível para a Biofy AI.";
  }

  if (attempt.status >= 500 || attempt.status === 0) {
    return "O Gemini está temporariamente indisponível. Tente novamente em instantes.";
  }

  if (attempt.status === 400) {
    return "O Google recusou a requisição da Biofy AI. Revise o projeto da chave no Google AI Studio.";
  }

  return `O Gemini recusou a chamada (HTTP ${attempt.status || "desconhecido"}).`;
}

async function requestInteraction(
  geminiKey: string,
  model: string,
  prompt: string,
): Promise<GeminiAttempt> {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiKey,
      },
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      body: JSON.stringify({ model, input: prompt, store: false }),
    });

    if (response.ok) {
      return { response, detail: "", status: response.status, timedOut: false, model, api: "interactions" };
    }

    return {
      response,
      detail: await readGeminiError(response),
      status: response.status,
      timedOut: false,
      model,
      api: "interactions",
    };
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      detail: cleanGeminiDetail(error instanceof Error ? error.message : "network_error"),
      status: 0,
      timedOut,
      model,
      api: "interactions",
    };
  }
}

async function discoverGenerateContentModel(geminiKey: string) {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
      {
        headers: { "x-goog-api-key": geminiKey },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      return {
        model: null,
        failure: {
          response,
          detail: await readGeminiError(response),
          status: response.status,
          timedOut: false,
          model: "models.list",
          api: "models.list" as const,
        },
      };
    }

    const payload = (await response.json()) as {
      models?: Array<{
        name?: string;
        baseModelId?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    const available = (payload.models ?? [])
      .filter((model) =>
        (model.supportedGenerationMethods ?? []).some(
          (method) => method.toLowerCase() === "generatecontent",
        ),
      )
      .map((model) => (model.baseModelId || model.name?.replace(/^models\//, "") || "").trim())
      .filter(Boolean);

    const preferred = LEGACY_MODEL_PRIORITY.find((model) => available.includes(model));
    const fallback = available.find(
      (model) =>
        model.startsWith("gemini-") &&
        !model.includes("image") &&
        !model.includes("live") &&
        !model.includes("embedding") &&
        !model.includes("tts"),
    );

    return { model: preferred ?? fallback ?? null, failure: null };
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      model: null,
      failure: {
        detail: cleanGeminiDetail(error instanceof Error ? error.message : "network_error"),
        status: 0,
        timedOut,
        model: "models.list",
        api: "models.list" as const,
      },
    };
  }
}

async function requestGenerateContent(
  geminiKey: string,
  model: string,
  prompt: string,
): Promise<GeminiAttempt> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
      },
    );

    if (response.ok) {
      return {
        response,
        detail: "",
        status: response.status,
        timedOut: false,
        model,
        api: "generateContent",
      };
    }

    return {
      response,
      detail: await readGeminiError(response),
      status: response.status,
      timedOut: false,
      model,
      api: "generateContent",
    };
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      detail: cleanGeminiDetail(error instanceof Error ? error.message : "network_error"),
      status: 0,
      timedOut,
      model,
      api: "generateContent",
    };
  }
}

async function callGemini(geminiKey: string, prompt: string) {
  let lastFailure: GeminiAttempt = {
    detail: "",
    status: 0,
    timedOut: false,
    model: INTERACTIONS_MODELS[0],
    api: "interactions",
  };

  for (const model of INTERACTIONS_MODELS) {
    const attempt = await requestInteraction(geminiKey, model, prompt);
    if (attempt.response?.ok) {
      return {
        success: { response: attempt.response, model, api: "interactions" as const } satisfies GeminiSuccess,
        failure: null,
      };
    }

    lastFailure = attempt;
    if ([400, 401, 403, 429].includes(attempt.status) || attempt.timedOut) {
      return { success: null, failure: attempt };
    }
  }

  const discovery = await discoverGenerateContentModel(geminiKey);
  if (discovery.model) {
    const legacyAttempt = await requestGenerateContent(geminiKey, discovery.model, prompt);
    if (legacyAttempt.response?.ok) {
      return {
        success: {
          response: legacyAttempt.response,
          model: discovery.model,
          api: "generateContent" as const,
        } satisfies GeminiSuccess,
        failure: null,
      };
    }
    lastFailure = legacyAttempt;
  } else if (discovery.failure) {
    lastFailure = discovery.failure;
  }

  return { success: null, failure: lastFailure };
}

function extractInteractionText(payload: unknown) {
  if (!isRecord(payload)) return "";
  if (typeof payload["output_text"] === "string" && payload["output_text"].trim()) {
    return payload["output_text"].trim();
  }

  const steps = Array.isArray(payload["steps"]) ? payload["steps"] : [];
  return steps
    .filter(isRecord)
    .filter((step) => step["type"] === "model_output")
    .flatMap((step) => (Array.isArray(step["content"]) ? step["content"] : []))
    .filter(isRecord)
    .filter((content) => content["type"] === "text" && typeof content["text"] === "string")
    .map((content) => String(content["text"] ?? ""))
    .join("")
    .trim();
}

function extractGenerateContentText(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload["candidates"])) return "";
  const candidate = payload["candidates"].find(isRecord);
  if (!candidate || !isRecord(candidate["content"]) || !Array.isArray(candidate["content"]["parts"])) {
    return "";
  }
  return candidate["content"]["parts"]
    .filter(isRecord)
    .map((part) => (typeof part["text"] === "string" ? part["text"] : ""))
    .join("")
    .trim();
}

function parseJsonText(text: string) {
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(unfenced) as Record<string, unknown>;
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(unfenced.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("INVALID_JSON");
  }
}

function sanitizeThemePatch(value: unknown): Partial<BioTheme> {
  if (!isRecord(value)) return {};
  const result: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(value)) {
    if (COLOR_FIELDS.has(key) && typeof raw === "string" && /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(raw)) {
      result[key] = raw;
      continue;
    }
    if (BOOLEAN_FIELDS.has(key) && typeof raw === "boolean") {
      result[key] = raw;
      continue;
    }
    const limits = NUMBER_LIMITS[key];
    if (limits && typeof raw === "number" && Number.isFinite(raw)) {
      result[key] = Math.max(limits[0], Math.min(limits[1], raw));
      continue;
    }
    const allowed = ENUM_FIELDS[key];
    if (allowed && typeof raw === "string" && allowed.includes(raw)) {
      result[key] = raw;
    }
  }

  return result as Partial<BioTheme>;
}

function uniqueExistingIds(value: unknown, existingIds: Set<string>, max = 30) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && existingIds.has(item)))].slice(0, max);
}

function canUseRequestedUrl(url: string, instruction: string) {
  return url.length <= 2048 && instruction.includes(url);
}

function sanitizeAgentResponse(
  parsed: Record<string, unknown>,
  currentBio: string,
  currentBlocks: CurrentBlock[],
  instruction: string,
): SanitizedAgentResponse {
  const existingIds = new Set(currentBlocks.map((block) => block.id));
  const profileRaw = isRecord(parsed["profile"]) ? parsed["profile"] : {};
  const displayName =
    typeof profileRaw["displayName"] === "string" && profileRaw["displayName"].trim()
      ? profileRaw["displayName"].trim().slice(0, 100)
      : undefined;

  const profileBio = typeof profileRaw["bio"] === "string" ? profileRaw["bio"] : undefined;
  const bioSource = typeof parsed["bio"] === "string" ? parsed["bio"] : profileBio;
  const bio = typeof bioSource === "string" ? bioSource.slice(0, 240) : currentBio;

  const linkTitles = Array.isArray(parsed["linkTitles"])
    ? parsed["linkTitles"]
        .filter(isRecord)
        .filter(
          (item) =>
            typeof item["id"] === "string" &&
            existingIds.has(item["id"] as string) &&
            typeof item["title"] === "string" &&
            Boolean((item["title"] as string).trim()),
        )
        .slice(0, 30)
        .map((item) => ({
          id: String(item["id"]),
          title: String(item["title"]).trim().slice(0, 120),
        }))
    : [];

  const blocks = Array.isArray(parsed["blocks"])
    ? parsed["blocks"]
        .filter(isRecord)
        .filter((item) => typeof item["id"] === "string" && existingIds.has(item["id"] as string))
        .slice(0, 30)
        .map((item) => {
          const update: { id: string; title?: string; url?: string | null; isVisible?: boolean } = {
            id: String(item["id"]),
          };
          if (typeof item["title"] === "string" && item["title"].trim()) {
            update.title = item["title"].trim().slice(0, 120);
          }
          if (typeof item["isVisible"] === "boolean") update.isVisible = item["isVisible"];
          if (item["url"] === null) update.url = null;
          if (
            typeof item["url"] === "string" &&
            item["url"].trim() &&
            canUseRequestedUrl(item["url"].trim(), instruction)
          ) {
            update.url = item["url"].trim();
          }
          return update;
        })
        .filter((item) => Object.keys(item).length > 1)
    : [];

  const orderRaw = uniqueExistingIds(parsed["order"], existingIds);
  const order = orderRaw.length === currentBlocks.length ? orderRaw : [];
  const removeBlockIds = uniqueExistingIds(parsed["removeBlockIds"], existingIds, 10);
  const duplicateBlockIds = uniqueExistingIds(parsed["duplicateBlockIds"], existingIds, 10);

  const addBlocks = Array.isArray(parsed["addBlocks"])
    ? parsed["addBlocks"]
        .filter(isRecord)
        .filter((item) => typeof item["type"] === "string" && ALLOWED_BLOCK_TYPES.has(item["type"] as string))
        .slice(0, 5)
        .map((item) => {
          const block: { type: string; title?: string | null; url?: string | null } = {
            type: String(item["type"]),
          };
          if (item["title"] === null) block.title = null;
          if (typeof item["title"] === "string") block.title = item["title"].trim().slice(0, 120);
          if (item["url"] === null) block.url = null;
          if (
            typeof item["url"] === "string" &&
            item["url"].trim() &&
            canUseRequestedUrl(item["url"].trim(), instruction)
          ) {
            block.url = item["url"].trim();
          }
          return block;
        })
    : [];

  const tips = Array.isArray(parsed["tips"])
    ? parsed["tips"]
        .filter((tip): tip is string => typeof tip === "string" && Boolean(tip.trim()))
        .slice(0, 3)
        .map((tip) => tip.trim().slice(0, 220))
    : [];

  return {
    message:
      typeof parsed["message"] === "string" && parsed["message"].trim()
        ? parsed["message"].trim().slice(0, 500)
        : "Pronto. Apliquei a alteração na sua página.",
    bio,
    linkTitles,
    profile: displayName ? { displayName } : {},
    theme: sanitizeThemePatch(parsed["theme"]),
    blocks,
    order,
    removeBlockIds,
    duplicateBlockIds,
    addBlocks,
    tips,
  };
}

function hasMutation(response: SanitizedAgentResponse, currentBio: string) {
  return (
    response.bio !== currentBio ||
    response.linkTitles.length > 0 ||
    Object.keys(response.profile).length > 0 ||
    Object.keys(response.theme).length > 0 ||
    response.blocks.length > 0 ||
    response.order.length > 0 ||
    response.removeBlockIds.length > 0 ||
    response.duplicateBlockIds.length > 0 ||
    response.addBlocks.length > 0
  );
}

function looksLikeEditRequest(instruction: string) {
  return /\b(melhore|melhorar|troque|trocar|mude|mudar|deixe|deixar|organize|organizar|arrume|arrumar|adicione|adicionar|remova|remover|oculte|ocultar|mostre|mostrar|reordene|reordenar|faça|fazer|edite|editar|coloque|colocar|aumente|aumentar|diminua|diminuir)\b/i.test(
    instruction,
  );
}

async function runAgent(geminiKey: string, prompt: string) {
  const result = await callGemini(geminiKey, prompt);
  if (!result.success) return { result, parsed: null as Record<string, unknown> | null };

  const payload = (await result.success.response.json()) as unknown;
  const text =
    result.success.api === "interactions"
      ? extractInteractionText(payload)
      : extractGenerateContentText(payload);

  if (!text) return { result, parsed: null as Record<string, unknown> | null };
  return { result, parsed: parseJsonText(text) };
}

export const Route = createFileRoute("/api/ai/bio")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const geminiKey = process.env["GEMINI_API_KEY"]?.trim();
        const supabaseUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
        const supabaseKey =
          process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

        if (!geminiKey || !supabaseUrl || !supabaseKey) {
          return Response.json({ error: "Configuração do servidor incompleta." }, { status: 500 });
        }

        const authorization = request.headers.get("authorization");
        const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
        if (!accessToken) {
          return Response.json({ error: "Sessão não encontrada." }, { status: 401 });
        }

        const authHeaders = { apikey: supabaseKey, Authorization: `Bearer ${accessToken}` };
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
        if (!userResponse.ok) {
          return Response.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
        }

        const user = (await userResponse.json()) as { id?: string };
        if (!user.id) return Response.json({ error: "Usuário inválido." }, { status: 401 });

        const subscriptionResponse = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(user.id)}&select=plan,status,current_period_end&limit=1`,
          { headers: authHeaders },
        );
        if (!subscriptionResponse.ok) {
          return Response.json({ error: "Não foi possível validar seu plano." }, { status: 403 });
        }

        const subscriptions = (await subscriptionResponse.json()) as Array<{
          plan?: string;
          status?: string;
          current_period_end?: string | null;
        }>;
        const subscription = subscriptions[0];
        const isMaster = subscription?.plan === "business";
        const activeStatus = Boolean(
          subscription?.status && ["active", "trialing"].includes(subscription.status),
        );
        const periodActive =
          !subscription?.current_period_end ||
          new Date(subscription.current_period_end).getTime() >= Date.now();

        if (!isMaster || !activeStatus || !periodActive) {
          return Response.json(
            { error: "A Biofy AI é exclusiva do plano Master." },
            { status: 403 },
          );
        }

        const body = (await request.json().catch(() => null)) as {
          instruction?: string;
          displayName?: string | null;
          bio?: string | null;
          theme?: Record<string, unknown>;
          links?: Array<{
            id?: string;
            title?: string | null;
            type?: string;
            isVisible?: boolean;
            position?: number;
          }>;
          history?: Array<{ role?: string; text?: string }>;
        } | null;

        if (!body) return Response.json({ error: "Pedido inválido." }, { status: 400 });

        const instruction = (body.instruction ?? "").trim().slice(0, 1000);
        if (!instruction) {
          return Response.json(
            { error: "Explique o que você quer mudar ou pergunte algo sobre a Biofy." },
            { status: 400 },
          );
        }

        const links: CurrentBlock[] = Array.isArray(body.links)
          ? body.links.slice(0, 30).map((link, index) => ({
              id: String(link.id ?? "").slice(0, 100),
              title: String(link.title ?? "").slice(0, 120),
              type: String(link.type ?? "link").slice(0, 40),
              isVisible: link.isVisible !== false,
              position:
                typeof link.position === "number" && Number.isFinite(link.position)
                  ? link.position
                  : index,
            }))
          : [];

        const history = Array.isArray(body.history)
          ? body.history
              .slice(-6)
              .map((item) => ({
                role: item.role === "assistant" ? ("assistant" as const) : ("user" as const),
                text: String(item.text ?? "").slice(0, 500),
              }))
              .filter((item) => item.text.trim())
          : [];

        const currentBio = String(body.bio ?? "").slice(0, 240);
        const currentTheme = sanitizeThemePatch(body.theme) as BioTheme;
        const prompt = buildBiofyAiPrompt({
          instruction,
          displayName: String(body.displayName ?? "").slice(0, 100),
          bio: currentBio,
          theme: currentTheme,
          links,
          history,
        });

        let firstRun;
        try {
          firstRun = await runAgent(geminiKey, prompt);
        } catch {
          return Response.json(
            { error: "O Gemini respondeu em um formato inesperado. Tente novamente." },
            { status: 502 },
          );
        }

        if (!firstRun.result.success) {
          const failure = firstRun.result.failure;
          const traceId = crypto.randomUUID();
          console.error("[Biofy AI] Gemini request failed", {
            traceId,
            api: failure.api,
            model: failure.model,
            status: failure.status,
            timedOut: failure.timedOut,
            detail: failure.detail,
          });
          return Response.json(
            {
              error: mapGeminiError(failure),
              code: failure.status ? `GEMINI_${failure.status}` : "GEMINI_NETWORK",
              model: failure.model,
              traceId,
            },
            { status: 502, headers: { "Cache-Control": "no-store" } },
          );
        }

        if (!firstRun.parsed) {
          return Response.json({ error: "O Gemini retornou uma resposta vazia." }, { status: 502 });
        }

        let response = sanitizeAgentResponse(firstRun.parsed, currentBio, links, instruction);

        if (looksLikeEditRequest(instruction) && !hasMutation(response, currentBio)) {
          try {
            const retryPrompt = `${prompt}\n\nCORREÇÃO OBRIGATÓRIA: o pedido atual exige edição. Não dê apenas conselhos. Retorne pelo menos uma mudança estruturada real que cumpra o pedido, quando tecnicamente possível.`;
            const retryRun = await runAgent(geminiKey, retryPrompt);
            if (retryRun.result.success && retryRun.parsed) {
              const retried = sanitizeAgentResponse(retryRun.parsed, currentBio, links, instruction);
              if (hasMutation(retried, currentBio)) response = retried;
            }
          } catch {
            // Keep the first valid response if the corrective pass fails.
          }
        }

        return Response.json(response, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
