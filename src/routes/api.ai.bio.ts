import { createFileRoute } from "@tanstack/react-router";

const GEMINI_TIMEOUT_MS = 12000;

function mapGeminiError(detail: string, status: number) {
  const normalized = detail.toLowerCase();
  if (status === 429 || normalized.includes("quota") || normalized.includes("resource_exhausted")) {
    return "A cota do Gemini foi atingida. Tente novamente em alguns minutos.";
  }
  if (status === 401 || status === 403 || normalized.includes("api key") || normalized.includes("api_key")) {
    return "A chave do Gemini não foi aceita pelo servidor. Revise a GEMINI_API_KEY na Vercel.";
  }
  if (normalized.includes("model") && normalized.includes("not found")) {
    return "O modelo do Gemini configurado não está disponível para esta chave.";
  }
  return "O Gemini está indisponível no momento. Tente novamente em instantes.";
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
          "Retorne apenas JSON válido com message, bio, linkTitles e tips. bio deve ter no máximo 240 caracteres. linkTitles deve conter apenas ids existentes. tips deve ter no máximo 3 itens curtos.",
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

        let geminiResponse: Response;
        try {
          geminiResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": geminiKey,
              },
              signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.45,
                  maxOutputTokens: 500,
                  responseMimeType: "application/json",
                  responseSchema,
                  thinkingConfig: { thinkingBudget: 0 },
                },
              }),
            },
          );
        } catch (error) {
          const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
          return Response.json(
            {
              error: isTimeout
                ? "O Gemini passou do limite de resposta. Envie novamente; a próxima tentativa usa uma chamada nova e rápida."
                : "Não foi possível conectar ao Gemini agora.",
            },
            { status: 502 },
          );
        }

        if (!geminiResponse.ok) {
          const upstream = (await geminiResponse.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          return Response.json(
            { error: mapGeminiError(upstream?.error?.message ?? "", geminiResponse.status) },
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
