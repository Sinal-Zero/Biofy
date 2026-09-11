import { createFileRoute } from "@tanstack/react-router";
import { buildBiofyAiPrompt } from "@/lib/biofy-ai-prompt";

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
    // Preserve Google's plain-text response, after redaction below.
  }

  return cleanGeminiDetail(detail);
}

function mapGeminiError(attempt: GeminiAttempt) {
  const normalized = attempt.detail.toLowerCase();

  if (attempt.timedOut) {
    return "O Gemini demorou demais para responder. Tente novamente.";
  }

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
    return "O projeto Gemini não expôs nenhum modelo compatível para a Biofy AI. A integração já tentou os modelos estáveis atuais e a descoberta automática de modelos.";
  }

  if (attempt.status >= 500 || attempt.status === 0) {
    return "O Gemini está temporariamente indisponível. Tente novamente em instantes.";
  }

  if (attempt.status === 400) {
    return "O Google recusou a requisição da Biofy AI. A integração está usando a API Interactions atual; revise o projeto da chave no Google AI Studio.";
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
      body: JSON.stringify({
        model,
        input: prompt,
        store: false,
      }),
    });

    if (response.ok) {
      return {
        response,
        detail: "",
        status: response.status,
        timedOut: false,
        model,
        api: "interactions",
      };
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
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
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
        success: {
          response: attempt.response,
          model,
          api: "interactions" as const,
        } satisfies GeminiSuccess,
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
  if (!payload || typeof payload !== "object") return "";

  const interaction = payload as {
    output_text?: unknown;
    steps?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (typeof interaction.output_text === "string" && interaction.output_text.trim()) {
    return interaction.output_text.trim();
  }

  return (interaction.steps ?? [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === "text" && typeof content.text === "string")
    .map((content) => content.text ?? "")
    .join("")
    .trim();
}

function extractGenerateContentText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const result = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return (result.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function parseJsonText(text: string) {
  const trimmed = text.trim();
  const unfenced = trimmed
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
        if (!user.id) {
          return Response.json({ error: "Usuário inválido." }, { status: 401 });
        }

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
          links?: Array<{ id?: string; title?: string | null; type?: string }>;
          history?: Array<{ role?: string; text?: string }>;
        } | null;

        if (!body) {
          return Response.json({ error: "Pedido inválido." }, { status: 400 });
        }

        const instruction = (body.instruction ?? "").trim().slice(0, 1000);
        if (!instruction) {
          return Response.json(
            { error: "Explique o que você quer melhorar na sua Bio." },
            { status: 400 },
          );
        }

        const links = Array.isArray(body.links)
          ? body.links.slice(0, 30).map((link) => ({
              id: String(link.id ?? "").slice(0, 100),
              title: String(link.title ?? "").slice(0, 120),
              type: String(link.type ?? "link").slice(0, 40),
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
        const prompt = buildBiofyAiPrompt({
          instruction,
          displayName: String(body.displayName ?? "").slice(0, 100),
          bio: currentBio,
          links,
          history,
        });

        const result = await callGemini(geminiKey, prompt);

        if (!result.success) {
          const failure = result.failure;
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

        const payload = (await result.success.response.json()) as unknown;
        const text =
          result.success.api === "interactions"
            ? extractInteractionText(payload)
            : extractGenerateContentText(payload);

        if (!text) {
          return Response.json({ error: "O Gemini retornou uma resposta vazia." }, { status: 502 });
        }

        try {
          const parsed = parseJsonText(text);
          const response = {
            message:
              typeof parsed["message"] === "string" && parsed["message"].trim()
                ? parsed["message"].trim().slice(0, 500)
                : "Pronto. Ajustei sua Bio.",
            bio: typeof parsed["bio"] === "string" ? parsed["bio"].slice(0, 240) : currentBio,
            linkTitles: Array.isArray(parsed["linkTitles"])
              ? parsed["linkTitles"]
                  .filter(
                    (item): item is { id: string; title: string } =>
                      typeof item === "object" &&
                      item !== null &&
                      typeof (item as { id?: unknown }).id === "string" &&
                      typeof (item as { title?: unknown }).title === "string",
                  )
                  .filter((item) => links.some((link) => link.id === item.id))
                  .slice(0, 30)
                  .map((item) => ({ id: item.id, title: item.title.slice(0, 120) }))
              : [],
            tips: Array.isArray(parsed["tips"])
              ? parsed["tips"]
                  .filter((tip): tip is string => typeof tip === "string")
                  .slice(0, 3)
                  .map((tip) => tip.slice(0, 220))
              : [],
          };

          return Response.json(response, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json(
            { error: "O Gemini respondeu em um formato inesperado. Tente novamente." },
            { status: 502 },
          );
        }
      },
    },
  },
});
