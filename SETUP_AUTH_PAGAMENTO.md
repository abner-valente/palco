# Setup de autenticacao e pagamento (Supabase + Stripe)

Passos para ativar o login e a assinatura no site publicado no GitHub Pages.

## 1. Supabase

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, rode o conteudo de `supabase/migrations/0001_subscriptions.sql`.
3. Em **Project Settings > API**, copie `Project URL` e `anon public key`.
4. Edite `docs/config.js` e preencha `url` e `anonKey` com esses valores.
5. Instale a Supabase CLI e faca login (`supabase login`), depois associe o projeto
   (`supabase link --project-ref SEU_PROJECT_REF`).

## 2. Stripe

1. Crie uma conta em https://stripe.com.
2. Em **Product catalog**, crie um produto com um **preco recorrente** (mensal/anual).
   Copie o `price_id`.
3. Em **Developers > API keys**, copie a `secret key` (sk_...).

## 3. Edge Functions

Defina os segredos (uma vez, no projeto Supabase):

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_xxx
supabase secrets set STRIPE_PRICE_ID=price_xxx
supabase secrets set SITE_URL=https://SEU_USUARIO.github.io/NOME_DO_REPO
```

Publique as functions:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy create-portal-session
```

A `create-portal-session` abre o Stripe Customer Portal (historico de
faturas + cancelamento de assinatura, hospedado pelo Stripe). Em
**Settings > Billing > Customer portal** no painel do Stripe, confirme
que existe uma configuracao (o Stripe cria uma padrao em modo teste
automaticamente; em modo producao pode ser preciso configurar uma vez).

Preencha `functionsUrl` em `docs/config.js` com `<SUPABASE_URL>/functions/v1`
(ex: `https://SEU_PROJETO.supabase.co/functions/v1`).

## 4. Webhook do Stripe

1. No painel do Stripe, vá em **Developers > Webhooks > Add endpoint**.
2. URL: a URL da function `stripe-webhook` publicada no passo anterior.
3. Eventos a escutar: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`.
4. Copie o `Signing secret` (whsec_...) e rode:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## 5. Teste local

Use o modo de teste do Stripe (chaves `sk_test_...`) e o cartão `4242 4242 4242 4242`
para validar o fluxo completo (cadastro -> assinar -> webhook -> liberacao do palco)
antes de trocar para as chaves de producao (`sk_live_...`).
