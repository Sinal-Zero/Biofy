import { createFileRoute } from "@tanstack/react-router";

const GEMINI_MODEL = "gemini-3.8-flash";

const responseSchema = {
  type: "object",
  properties: {
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
    tips: {
      type: "array",
      items: { type: "string" },
    },
    message: { type: "string" },
  },
  required: ["bio", "linkTitles", "tips", "message"],
} as const;

function providerErrorMessage(status: number) {
  if (status === 400) return "O Gemini recusou a solicitação. Tente escrever o pedido de outra forma.";
  if (status === 401 || status === 403)
    return "A chave do Gemini não foi aceita pelo servidor. Confira a GEMINI_API_KEY na Vercel.";
  if (status === 404) return "O modelo Gemini configurado não está disponível para esta chave.";
  if (status === 429) return "O limite do Gemini foi atingido. Aguarde um pouco e tente novamente.";
  if (status >= 500) return "O Gemini está temporariamente indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir a resposta da IA.";
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
        const accessToken = authorization?.startsWith("Bearer ")
          ? authorization.slice(7)
          : null;

        if (!accessToken) {
          return Response.json({ error: "Sessão não encontrada." }, { status: 401 });
        }

        const authHeaders = {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
        };

        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: authHeaders,
        });

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
            { error: "O Assistente de IA está disponível nos planos Pro e Master." },
            { status: 403 },
          );
        }

        const body = (await request.json().catch(() => null)) as
          | {
              instruction?: string;
              displayName?: string | null;
              bio?: string | null;
              links?: Array<{ id?: string; title?: string | null; type?: string }>;
              previousInteractionId?: string | null;
            }
          | null;

        if (!body) {
          return Response.json({ error: "Pedido inválido." }, { status: 400 });
        }

        const instruction = (body.instruction ?? "").trim().slice(0, 1000);
        if (!instruction) {
          return Response.json({ error: "Escreva o que você quer mudar na sua Bio." }, { status: 400 });
        }

        const previousInteractionId =
          typeof body.previousInteractionId === "string" &&
          /^int_[A-Za-z0-9_-]+$/.test(body.previousInteractionId)
            ? body.previousInteractionId
            : undefined;

        const links = Array.isArray(body.links)
          ? body.links.slice(0, 30).map((link) => ({
              id: String(link.id ?? "").slice(0, 100),
              title: String(link.title ?? "").slice(0, 120),
              type: String(link.type ?? "link").slice(0, 40),
            }))
          : [];

        const prompt = `Você é a Biofy AI, uma assistente especializada em páginas de bio. Fale em português do Brasil, com tom natural, curto e útil. Sua função é editar a página junto com o usuário, não apenas dar dicas genéricas. Nunca invente credenciais, resultados, clientes, números ou fatos. Nunca altere URLs.\n\nPedido atual: ${instruction}\nNome atual: ${String(body.displayName ?? "").slice(0, 100)}\nBio atual: ${String(body.bio ?? "").slice(0, 500)}\nLinks atuais: ${JSON.stringify(links)}\n\nRetorne uma nova bio apenas quando fizer sentido; preserve o conteúdo atual quando o pedido não exigir mudança. Sugira novos títulos somente para ids existentes. A mensagem deve explicar em 1 ou 2 frases o que você fez. Máximo de 3 dicas curtas.`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        let interactionResponse: Response;
        try {
          interactionResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": geminiKey,
                "Api-Revision": "2026-05-20",
              },
              signal: controller.signal,
              body: JSON.stringify({
                model: GEMINI_MODEL,
                input: prompt,
                ...(previousInteractionId
                  ? { previous_interaction_id: previousInteractionId }
                  : {}),
                response_format: {
                  type: "text",
                  mime_type: "application/json",
                  schema: responseSchema,
                },
                generation_config: {
                  temperature: 0.55,
                  max_output_tokens: 1100,
                },
              }),
            },
          );
        } catch (error) {
          clearTimeout(timeout);
          if (error instanceof Error && error.name === "AbortError") {
            return Response.json(
              { error: "O Gemini demorou demais para responder. Tente novamente." },
              { status: 504 },
            );
          }
          return Response.json({ error: "Falha ao conectar com o Gemini." }, { status: 502 });
        }
        clearTimeout(timeout);

        if (!interactionResponse.ok) {
          return Response.json(
            {
              error: providerErrorMessage(interactionResponse.status),
              providerStatus: interactionResponse.status,
            },
            { status: 502 },
          );
        }

        const interaction = (await interactionResponse.json()) as {
          id?: string;
          status?: string;
          steps?: Array<{
            type?: string;
            content?: Array<{ type?: string; text?: string }>;
          }>;
        };

        const text = interaction.steps
          ?.filter((step) => step.type === "model_output")
          .flatMap((step) => step.content ?? [])
          .filter((content) => content.type === "text" && typeof content.text === "string")
          .map((content) => content.text)
          .join("")
          .trim();

        if (!text) {
          return Response.json(
            { error: "O Gemini respondeu sem conteúdo utilizável. Tente novamente." },
            { status: 502 },
          );
        }

        try {
          const parsed = JSON.parse(text) as {
            bio?: unknown;
            linkTitles?: unknown;
            tips?: unknown;
            message?: unknown;
          };

          const result = {
            bio: typeof parsed.bio === "string" ? parsed.bio.slice(0, 240) : "",
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
            message:
              typeof parsed.message === "string"
                ? parsed.message.slice(0, 500)
                : "Atualizei sua Bio com base no seu pedido.",
            interactionId: typeof interaction.id === "string" ? interaction.id : null,
          };

          return Response.json(result, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          return Response.json(
            { error: "O Gemini retornou uma resposta que não consegui interpretar. Tente novamente." },
            { status: 502 },
          );
        }
      },
    },
  },
});
