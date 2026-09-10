import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/bio")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const geminiKey = process.env["GEMINI_API_KEY"];
        const supabaseUrl =
          process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
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
            }
          | null;

        if (!body) {
          return Response.json({ error: "Pedido inválido." }, { status: 400 });
        }

        const instruction = (body.instruction ?? "").trim().slice(0, 800);
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

        const prompt = `Você é o Assistente Biofy. Ajude a pessoa a melhorar uma página de bio de forma objetiva, natural e profissional em português do Brasil. Não invente credenciais, números, resultados, clientes ou fatos. Não altere URLs. Evite clichês e texto genérico.\n\nPedido do usuário: ${instruction}\nNome atual: ${String(body.displayName ?? "").slice(0, 100)}\nBio atual: ${String(body.bio ?? "").slice(0, 500)}\nLinks atuais: ${JSON.stringify(links)}\n\nResponda SOMENTE com JSON válido, sem markdown, no formato exato:\n{"bio":"texto com no máximo 240 caracteres","linkTitles":[{"id":"id existente","title":"título curto"}],"tips":["dica curta","dica curta"]}\nUse somente ids existentes em links atuais. Se não houver melhoria útil para um link, omita-o. Máximo de 4 dicas.`;

        const geminiResponse = await fetch(
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
                temperature: 0.65,
                maxOutputTokens: 900,
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (!geminiResponse.ok) {
          return Response.json({ error: "A IA não conseguiu responder agora." }, { status: 502 });
        }

        const geminiPayload = (await geminiResponse.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          return Response.json({ error: "A IA retornou uma resposta vazia." }, { status: 502 });
        }

        try {
          const parsed = JSON.parse(text) as {
            bio?: unknown;
            linkTitles?: unknown;
            tips?: unknown;
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
                  .slice(0, 4)
                  .map((tip) => tip.slice(0, 220))
              : [],
          };

          return Response.json(result, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          return Response.json({ error: "A IA retornou um formato inesperado." }, { status: 502 });
        }
      },
    },
  },
});
