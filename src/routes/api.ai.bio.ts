import { createFileRoute } from "@tanstack/react-router";

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

        const instruction = (body.instruction ?? "").trim().slice(0, 800);
        if (!instruction) {
          return Response.json({ error: "Explique o que você quer melhorar na sua Bio." }, { status: 400 });
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

        const prompt = `Você é a Biofy AI, uma assistente de edição de página de bio. Responda em português do Brasil, de forma natural, curta e útil. Sua função é melhorar diretamente a página com base no pedido do usuário. Não invente credenciais, números, resultados, clientes ou fatos. Não altere URLs. Preserve a intenção do usuário e evite clichês.\n\nPedido: ${instruction}\nNome atual: ${String(body.displayName ?? "").slice(0, 100)}\nBio atual: ${String(body.bio ?? "").slice(0, 500)}\nLinks atuais: ${JSON.stringify(links)}\n\nRetorne um JSON com: message (resposta curta ao usuário explicando o que foi feito), bio (nova bio com no máximo 240 caracteres; se não precisar mudar, repita a atual), linkTitles (somente ids existentes e títulos que realmente devem mudar) e tips (no máximo 3 observações curtas).`;

        const responseFormat = {
          type: "text",
          mime_type: "application/json",
          schema: {
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
          },
        };

        let text = "";
        let interactionId: string | null = null;

        try {
          const interactionResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": geminiKey,
                "Api-Revision": "2026-05-20",
              },
              body: JSON.stringify({
                model: "gemini-2.5-flash",
                input: prompt,
                response_format: responseFormat,
                generation_config: {
                  temperature: 0.55,
                  max_output_tokens: 900,
                },
                ...(previousInteractionId
                  ? { previous_interaction_id: previousInteractionId }
                  : {}),
              }),
            },
          );

          if (interactionResponse.ok) {
            const interaction = (await interactionResponse.json()) as {
              id?: string;
              steps?: Array<{
                type?: string;
                content?: Array<{ type?: string; text?: string }>;
              }>;
            };

            interactionId = typeof interaction.id === "string" ? interaction.id : null;
            text =
              interaction.steps
                ?.filter((step) => step.type === "model_output")
                .flatMap((step) => step.content ?? [])
                .filter((content) => content.type === "text" && typeof content.text === "string")
                .map((content) => content.text)
                .join("")
                .trim() ?? "";
          }
        } catch {
          // The fallback below keeps Biofy AI available if Interactions is temporarily unavailable.
        }

        if (!text) {
          try {
            const fallbackResponse = await fetch(
              "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": geminiKey,
                },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.55,
                    maxOutputTokens: 900,
                    responseMimeType: "application/json",
                    responseSchema: responseFormat.schema,
                  },
                }),
              },
            );

            if (!fallbackResponse.ok) {
              const upstream = (await fallbackResponse.json().catch(() => null)) as
                | { error?: { message?: string } }
                | null;
              const detail = upstream?.error?.message?.toLowerCase() ?? "";
              const message = detail.includes("quota")
                ? "A cota do Gemini foi atingida. Tente novamente em alguns minutos."
                : detail.includes("api key") || detail.includes("api_key")
                  ? "A chave do Gemini não foi aceita pelo servidor. Revise a GEMINI_API_KEY na Vercel."
                  : "O Gemini está indisponível no momento. Tente novamente em instantes.";
              return Response.json({ error: message }, { status: 502 });
            }

            const fallbackPayload = (await fallbackResponse.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            text = fallbackPayload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
          } catch {
            return Response.json(
              { error: "Não foi possível conectar ao Gemini. Tente novamente em instantes." },
              { status: 502 },
            );
          }
        }

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
                : "Atualizei sua Bio com base no seu pedido.",
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
                  .map((item) => ({ id: item.id, title: item.title.slice(0, 120) })),
            tips: Array.isArray(parsed.tips)
              ? parsed.tips
                  .filter((tip): tip is string => typeof tip === "string")
                  .slice(0, 3)
                  .map((tip) => tip.slice(0, 220))
              : [],
            interactionId,
          };

          return Response.json(result, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          return Response.json(
            { error: "O Gemini respondeu em um formato inválido. Tente enviar o pedido novamente." },
            { status: 502 },
          );
        }
      },
    },
  },
});
