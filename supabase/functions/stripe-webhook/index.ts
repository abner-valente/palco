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
//   RESEND_API_KEY          - chave da API do Resend para envio de e-mail

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

async function enviarEmailBoasVindas(email: string, periodoFim: Date) {
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!resendKey) return;

  const dataRenovacao = periodoFim.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: [email],
      subject: "Bem-vindo ao Palco de Papeis!",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#222;">
          <h2 style="color:#2d5f3c;">Bem-vindo ao Palco de Papeis! 🎭</h2>
          <p>Sua assinatura foi confirmada com sucesso. A partir de agora voce tem acesso completo ao app.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr>
              <td style="padding:8px;border:1px solid #ddd;color:#555;">Status</td>
              <td style="padding:8px;border:1px solid #ddd;font-weight:bold;color:#2d5f3c;">Ativo</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #ddd;color:#555;">Proxima renovacao</td>
              <td style="padding:8px;border:1px solid #ddd;">${dataRenovacao}</td>
            </tr>
          </table>
          <p>Para acessar o app, <a href="${Deno.env.get("SITE_URL") ?? ""}" style="color:#2d5f3c;">clique aqui</a>.</p>
          <p>Para gerenciar ou cancelar sua assinatura, acesse seu perfil dentro do app.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="font-size:12px;color:#999;">Voce esta recebendo este e-mail porque realizou uma assinatura no Palco de Papeis.</p>
        </div>
      `,
    }),
  });
}

async function upsertSubscriptionFromStripe(subscriptionId: string, customerId: string): Promise<string | null> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;
  if (!userId) return null;

  // Se o usuario agendou cancelamento, trata como cancelado imediatamente
  const statusEfetivo = subscription.cancel_at_period_end ? "canceled" : subscription.status;

  const { error } = await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: statusEfetivo,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Falha ao gravar subscriptions:", error);
    throw error;
  }
  return userId;
}

async function deletarUsuario(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Falha ao deletar usuario:", error);
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
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
        if (customer.email) {
          await enviarEmailBoasVindas(
            customer.email,
            new Date(subscription.current_period_end * 1000),
          );
        }
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertSubscriptionFromStripe(subscription.id, subscription.customer as string);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await upsertSubscriptionFromStripe(subscription.id, subscription.customer as string);
      if (userId) {
        await deletarUsuario(userId);
      }
      break;
    }
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
