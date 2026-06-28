// Edge Function: recebe os eventos do Stripe e atualiza o status da assinatura no Supabase.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Configurar no painel do Stripe: Webhooks -> Add endpoint -> URL desta function,
// eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
//
// Variaveis de ambiente necessarias (supabase secrets set ...):
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   - whsec_... (gerado ao criar o endpoint no Stripe)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

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

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

async function upsertSubscriptionFromStripe(subscriptionId: string, customerId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;
  if (!userId) return;

  const { error } = await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status, // active | past_due | canceled | trialing | ...
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Falha ao gravar subscriptions:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Assinatura invalida: ${err}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription && session.customer) {
        await upsertSubscriptionFromStripe(
          session.subscription as string,
          session.customer as string,
        );
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertSubscriptionFromStripe(subscription.id, subscription.customer as string);
      break;
    }
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
