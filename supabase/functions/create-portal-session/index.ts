// Edge Function: cria uma sessao do Stripe Customer Portal para o usuario autenticado
// gerenciar a propria assinatura (ver faturas, cancelar, atualizar cartao).
// Deploy: supabase functions deploy create-portal-session
//
// Pre-requisito: configurar o Customer Portal no painel do Stripe
// (Settings > Billing > Customer portal) pelo menos uma vez, mesmo em modo teste.
//
// Variaveis de ambiente necessarias (supabase secrets set ...):
//   STRIPE_SECRET_KEY
//   SUPABASE_URL              - preenchido automaticamente pelo Supabase
//   SUPABASE_SERVICE_ROLE_KEY - preenchido automaticamente pelo Supabase
//   SITE_URL                  - ex: https://<usuario>.github.io/<repo>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=denonext";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const allowedOrigin = new URL(Deno.env.get("SITE_URL") ?? "https://example.github.io/palco").origin;
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// Idiomas que o app oferece, nos codigos que o Stripe aceita. O Stripe
// devolve 400 para codigo fora da lista dele — "es-ES" e "en-US", que o app
// usa no <html lang>, nao servem aqui. Qualquer outra coisa vira "auto".
const LOCALES_ACEITOS = new Set(["auto", "pt-BR", "es", "en"]);

async function lerLocale(req: Request): Promise<string> {
  try {
    const body = await req.json();
    const locale = body?.locale;
    if (typeof locale === "string" && LOCALES_ACEITOS.has(locale)) return locale;
  } catch {
    // Sem corpo ou JSON invalido: nao e erro, so nao sabemos o idioma.
  }
  return "auto";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Le o corpo primeiro: so da para consumir o stream uma vez.
    const locale = await lerLocale(req);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Usuario nao autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "Nenhuma assinatura encontrada para essa conta." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://example.github.io/palco";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${siteUrl}/index.html?portal=return`,
      locale,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
