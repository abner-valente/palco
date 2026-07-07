// Edge Function: cria uma sessao de Stripe Checkout para o usuario autenticado.
// Deploy: supabase functions deploy create-checkout-session
//
// Variaveis de ambiente necessarias (supabase secrets set ...):
//   STRIPE_SECRET_KEY      - chave secreta do Stripe (sk_...)
//   STRIPE_PRICE_ID        - id do preco recorrente criado no Stripe (price_...)
//   SUPABASE_URL           - preenchido automaticamente pelo Supabase
//   SUPABASE_SERVICE_ROLE_KEY - preenchido automaticamente pelo Supabase
//   SITE_URL               - ex: https://<usuario>.github.io/<repo>

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Usuario nao autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    // Reaproveita o customer do Stripe se ja existir, senao cria um novo.
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      const { error: upsertError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({ user_id: user.id, stripe_customer_id: customerId, status: "inactive" });
      if (upsertError) {
        console.error("Falha ao gravar subscriptions:", upsertError);
        throw upsertError;
      }
    }

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://example.github.io/palco";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: Deno.env.get("STRIPE_PRICE_ID") ?? "", quantity: 1 }],
      success_url: `${siteUrl}/index.html?checkout=sucesso`,
      cancel_url: `${siteUrl}/index.html?checkout=cancelado`,
      metadata: { supabase_user_id: user.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
