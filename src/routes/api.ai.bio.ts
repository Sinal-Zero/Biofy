import { createFileRoute } from "@tanstack/react-router";

const GEMINI_TIMEOUT_MS = 20000;
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;

function cleanGeminiDetail(detail: string) {
  return detail
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function mapGeminiError(detail: string, status: number) {
  const normalized = detail.toLowerCase();
  if (status === 429 || normalized.includes("quota") || normalized.includes("resource_exhausted")) {
    return "A cota do Gemini foi atingida. Tente novamente em alguns minutos.";
  }
  if (
    status === 401 ||
    status === 403 ||
    normalized.includes("api key") ||
    normalized.includes("api_key") ||
    normalized.includes("permission_denied") ||
    normalized.includes("key not valid")
  ) {
    return "A chave do Gemini não foi aceita pelo Google. Confira a GEMINI_API_KEY e se ela pertence a um projeto com a Gemini API disponível.";
  }
  if (normalized.includes("location") && normalized.includes("not supported")) {
    return "O Google informou que a localização do projeto/chave não é compatível com a Gemini API.";
  }
  if (normalized.includes("model") && (normalized.includes("not found") || normalized.includes("not supported"))) {
    return "O modelo Gemini configurado não está disponível para esta chave.";
  }
  if (status >= 500 || status === 0) {
    return "O Gemini está temporariamente indisponível. Tente novamente em instantes.";
  }
  if (status === 400 && detail) {
    return `O Gemini recusou a solicitação: ${cleanGeminiDetail(detail)}`;
  }
  return "O Gemini recusou a solicitação. Tente novamente; se persistir, revise a chave e o projeto da Gemini API.";
}

type GeminiAttempt = {
  response?: Response;
  detail: string;
  status: number;
  timedOut: boolean;
};

async function requestGemini(
  geminiKey: string,
  model: (typeof GEMINI_MODELS)[number],
  prompt: string,
): Promise<GeminiAttempt> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (response.ok) return { response, detail: "", status: response.status, timedOut: false };

    const raw = await response.text();
    let detail = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string; status?: string } };
      detail = [parsed.error?.status, parsed.error?.message].filter(Boolean).join(": ") || raw;
    } catch {
      // Keep the raw response text when Google does not return JSON.
    }

    return { response, detail: cleanGeminiDetail(detail), status: response.status, timedOut: false };
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      detail: error instanceof Error ? error.message : "network_error",
      status: 0,
      timedOut,
    };
  }
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
        const geminiKey = process.env["GEMINI_API_KEY"];
        const supabaseUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
        const supabaseKey =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

        if (!geminiKey || !supabaseUrl || !supabaseKey) {
          return Response.json({ error: "Configuração do servidor incompleta." }, { status: 500 });
        }

        const authorization = request.headers.get("authorization");
        const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
        if (!accessToken) return Response.json({ error: "Sessão não encontrada." }, { status: 401 });

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
        const activeStatus = Boolean(subscription?.status && ["active", "trialing"].includes(subscription.status));
        const periodActive =
          !subscription?.current_period_end || new Date(subscription.current_period_end).getTime() >= Date.now();

        if (!isMaster || !activeStatus || !periodActive) {
          return Response.json(
            { error: "A Biofy AI é exclusiva do plano Master." },
            { status: 403 },
          );
        }

        const body = (await request.json().catch(() => null)) as
          | {
              instruction?: string;
              displayName?: string | null;
              bio?: string | null;
              links?: Array<{ id?: string; title?: string | null; type?: string }>;
              history?: Array<{ role?: string; text?: string }>;
            }
          | null;
        if (!body) return Response.json({ error: "Pedido inválido." }, { status: 400 });

        const instruction = (body.instruction ?? "").trim().slice(0, 1000);
        if (!instruction) {
          return Response.json({ error: "Explique o que você quer melhorar na sua Bio." }, { status: 400 });
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
                role: item.role === "assistant" ? "assistant" : "user",
                text: String(item.text ?? "").slice(0, 500),
              }))
              .filter((item) => item.text.trim())
          : [];

        const prompt = [
          "Você é a Biofy AI, assistente de edição de páginas de bio.",
          "Responda em português do Brasil, de forma curta, natural e útil.",
          "Edite somente o que foi pedido. Não invente fatos, números, clientes ou credenciais. Nunca altere URLs.",
          `Nome atual: ${String(body.displayName ?? "").slice(0, 100)}`,
          `Bio atual: ${String(body.bio ?? "").slice(0, 240)}`,
          `Links atuais: ${JSON.stringify(links)}`,
          history.length ? `Conversa recente: ${JSON.stringify(history)}` : "",
          `Pedido: ${instruction}`,
          'Retorne somente um objeto JSON válido, sem markdown, no formato {"message":"resposta curta","bio":"bio com até 240 caracteres","linkTitles":[{"id":"id existente","title":"novo título"}],"tips":["dica curta"]}. Se não mudar a bio, repita a bio atual. Só use IDs existentes.',
        ].filter(Boolean).join("\n");

        let geminiResponse: Response | undefined;
        let lastFailure: GeminiAttempt = { detail: "", status: 0, timedOut: false };

        for (const model of GEMINI_MODELS) {
          const attempt = await requestGemini(geminiKey, model, prompt);
          if (attempt.response?.ok) {
            geminiResponse = attempt.response;
            break;
          }
          lastFailure = attempt;
          if ([401, 403, 429].includes(attempt.status)) break;
        }

        if (!geminiResponse) {
          const error = lastFailure.timedOut
            ? "O Gemini demorou demais para responder. Tente novamente."
            : mapGeminiError(lastFailure.detail, lastFailure.status);
          return Response.json(
            {
              error,
              code: lastFailure.status ? `GEMINI_${lastFailure.status}` : "GEMINI_NETWORK",
            },
            { status: 502 },
          );
        }

        const payload = (await geminiResponse.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim();
        if (!text) return Response.json({ error: "O Gemini retornou uma resposta vazia." }, { status: 502 });

        try {
          const parsed = parseJsonText(text);
          const currentBio = String(body.bio ?? "").slice(0, 240);
          const result = {
            message:
              typeof parsed["message"] === "string" && parsed["message"].trim()
                ? parsed["message"].trim().slice(0, 500)
                : "Pronto. Ajustei sua Bio.",
            bio: typeof parsed["bio"] === "string" ? parsed["bio"].slice(0, 240) : currentBio,
            linkTitles: Array.isArray(parsed["linkTitles"])
              ? parsed["linkTitles"]
                  .filter(
                    (item): item is { id: string; title: string } =>
                      typeof item === "object" && item !== null &&
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
          return Response.json(result, { headers: { "Cache-Control": "no-store" } });
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
