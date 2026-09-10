import { createFileRoute } from "@tanstack/react-router";

const GEMINI_TIMEOUT_MS = 15000;
const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;

function mapGeminiError(detail: string, status: number) {
  const normalized = detail.toLowerCase();
  if (status === 429 || normalized.includes("quota") || normalized.includes("resource_exhausted")) {
    return "A cota gratuita do Gemini foi atingida. Tente novamente em alguns minutos.";
  }
  if (
    status === 401 ||
    status === 403 ||
    normalized.includes("api key") ||
    normalized.includes("api_key") ||
    normalized.includes("permission_denied")
  ) {
    return "A GEMINI_API_KEY não foi aceita pelo Google. Confira a chave e as restrições dela no Google AI Studio.";
  }
  if (normalized.includes("model") && (normalized.includes("not found") || normalized.includes("not supported"))) {
    return "Nenhum dos modelos Gemini configurados está disponível para essa chave.";
  }
  if (status >= 500) {
    return "O serviço do Gemini está temporariamente instável. Tente novamente em alguns instantes.";
  }
  return "O Google recusou a solicitação da Biofy AI. Revise a configuração da Gemini API e tente novamente.";
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
  responseSchema: Record<string, unknown>,
  simplified = false,
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
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: simplified
            ? {
                temperature: 0.45,
                maxOutputTokens: 600,
                responseMimeType: "application/json",
              }
            : {
                temperature: 0.45,
                maxOutputTokens: 600,
                responseMimeType: "application/json",
                responseSchema,
              },
        }),
      },
    );

    if (response.ok) return { response, detail: "", status: response.status, timedOut: false };

    const upstream = (await response.json().catch(() => null)) as
      | { error?: { message?: string; status?: string } }
      | null;
    const detail = [upstream?.error?.status, upstream?.error?.message].filter(Boolean).join(": ");
    return { response, detail, status: response.status, timedOut: false };
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

        if (!accessToken) {
          return Response.json({ error: "Sessão não encontrada." }, { status: 401 });
        }

        const authHeaders = {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
        };

        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
        if (!userResponse.ok) {
          return Response.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
        }

        const user = (await userResponse.json()) as { id?: string };
        if (!user.id) {
          return Response.json({ error: "Usuário inválido." }, { status: 401 });
        }

        const subscriptionResponse = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(user.id)}&select=plan,status&limit=1`,
          { headers: authHeaders },
        );

        if (!subscriptionResponse.ok) {
          return Response.json({ error: "Não foi possível validar seu plano." }, { status: 403 });
        }

        const subscriptions = (await subscriptionResponse.json()) as Array<{
          plan?: string;
          status?: string;
        }>;
        const subscription = subscriptions[0];
        const allowedPlan = subscription?.plan === "pro" || subscription?.plan === "business";
        const activeStatus = !subscription?.status || ["active", "trialing"].includes(subscription.status);

        if (!allowedPlan || !activeStatus) {
          return Response.json(
            { error: "A Biofy AI está disponível nos planos Pro e Master." },
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

        if (!body) {
          return Response.json({ error: "Pedido inválido." }, { status: 400 });
        }

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
          "Você é a Biofy AI, uma assistente rápida de edição de páginas de bio.",
          "Responda em português do Brasil. Seja curta, natural e útil.",
          "Edite apenas o que o pedido exige. Não invente fatos, números, clientes ou credenciais. Não altere URLs.",
          `Nome: ${String(body.displayName ?? "").slice(0, 100)}`,
          `Bio atual: ${String(body.bio ?? "").slice(0, 240)}`,
          `Links: ${JSON.stringify(links)}`,
          history.length ? `Conversa recente: ${JSON.stringify(history)}` : "",
          `Pedido atual: ${instruction}`,
          'Retorne SOMENTE JSON válido no formato: {"message":"resposta curta","bio":"bio com até 240 caracteres","linkTitles":[{"id":"id existente","title":"novo título"}],"tips":["dica curta"]}. Se não precisar mudar a bio, repita a bio atual. Use apenas ids de links existentes.',
        ]
          .filter(Boolean)
          .join("\n");

        const responseSchema = {
          type: "object",
          properties: {
            message: { type: "string" },
            bio: { type: "string" },
            linkTitles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                },
                required: ["id", "title"],
              },
            },
            tips: { type: "array", items: { type: "string" } },
          },
          required: ["message", "bio", "linkTitles", "tips"],
        };

        let geminiResponse: Response | undefined;
        let lastFailure: GeminiAttempt = { detail: "", status: 0, timedOut: false };

        for (const model of GEMINI_MODELS) {
          const fullAttempt = await requestGemini(geminiKey, model, prompt, responseSchema, false);
          if (fullAttempt.response?.ok) {
            geminiResponse = fullAttempt.response;
            break;
          }
          lastFailure = fullAttempt;

          // A 400 normalmente indica incompatibilidade de algum recurso opcional da configuração.
          // Repetimos uma vez com payload mínimo antes de trocar de modelo.
          if (fullAttempt.status === 400) {
            const simpleAttempt = await requestGemini(geminiKey, model, prompt, responseSchema, true);
            if (simpleAttempt.response?.ok) {
              geminiResponse = simpleAttempt.response;
              break;
            }
            lastFailure = simpleAttempt;
          }

          // Erros de chave/permissão e quota não melhoram tentando outro modelo.
          if ([401, 403, 429].includes(lastFailure.status)) break;
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
        const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!text) {
          return Response.json({ error: "O Gemini retornou uma resposta vazia." }, { status: 502 });
        }

        try {
          const parsed = JSON.parse(text) as {
            message?: unknown;
            bio?: unknown;
            linkTitles?: unknown;
            tips?: unknown;
          };

          const currentBio = String(body.bio ?? "").slice(0, 240);
          const result = {
            message:
              typeof parsed.message === "string" && parsed.message.trim()
                ? parsed.message.trim().slice(0, 500)
                : "Pronto. Ajustei sua Bio.",
            bio: typeof parsed.bio === "string" ? parsed.bio.slice(0, 240) : currentBio,
            linkTitles: Array.isArray(parsed.linkTitles)
              ? parsed.linkTitles
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
            tips: Array.isArray(parsed.tips)
              ? parsed.tips
                  .filter((tip): tip is string => typeof tip === "string")
                  .slice(0, 3)
                  .map((tip) => tip.slice(0, 220))
              : [],
          };

          return Response.json(result, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json(
            { error: "O Gemini respondeu em um formato inválido. Tente novamente." },
            { status: 502 },
          );
        }
      },
    },
  },
});
