# Checklist: transferir Stripe e Supabase para a conta da Ana Lucia

Use isso quando for a hora de mover o projeto da minha conta pessoal
(Stripe e Supabase) para a conta da empresa da Ana Lucia.

## Stripe (precisa recriar — Stripe nao transfere conta)

- [ ] Ana Lucia cria conta em https://stripe.com com os dados da empresa (CNPJ).
- [ ] Recriar o produto e o preco recorrente na conta nova:
      Catalogo de produtos > Adicionar produto > preco recorrente (mensal/anual).
      Anotar o novo `price_id` (comeca com `price_...`).
- [ ] Pegar a `secret key` da conta nova: Desenvolvedores > Chaves de API
      (comeca com `sk_test_...` em teste, `sk_live_...` em producao).
- [ ] Criar o webhook na conta nova (Workbench > Webhooks > Add endpoint):
      - URL: `https://cdfmmpgcpmqczfqvbxfh.supabase.co/functions/v1/stripe-webhook`
        (ou a URL do projeto Supabase na epoca, se ja tiver sido transferido)
      - Eventos: `checkout.session.completed`, `customer.subscription.updated`,
        `customer.subscription.deleted`
      - Formato: snapshot/classico (nao "thin events")
      - Anotar o `Signing secret` novo (comeca com `whsec_...`)
- [ ] Confirmar que o Customer Portal esta habilitado na conta nova:
      Settings > Billing > Customer portal (o Stripe cria uma config padrao
      em modo teste automaticamente; em producao pode ser preciso configurar
      uma vez).
- [ ] Atualizar os secrets no Supabase com os valores novos:
  ```bash
  supabase secrets set STRIPE_SECRET_KEY=sk_xxx_da_conta_nova
  supabase secrets set STRIPE_PRICE_ID=price_xxx_da_conta_nova
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx_da_conta_nova
  ```
- [ ] Fazer redeploy das functions para garantir que pegam os novos valores:
  ```bash
  supabase functions deploy create-checkout-session
  supabase functions deploy stripe-webhook --no-verify-jwt
  supabase functions deploy create-portal-session
  ```
- [ ] Testar de novo o fluxo completo (cadastro -> assinar -> webhook ->
      liberacao do palco) com o cartao de teste `4242 4242 4242 4242`
      antes de trocar para chaves de producao.

> Nao ha dado historico para migrar: como o projeto esta em modo teste,
> nao existem assinaturas reais cobrando ainda. E so recriar a configuracao
> na conta certa antes de ir para producao.

## Supabase (tem transferencia de projeto de verdade)

- [ ] Ana Lucia cria uma conta em https://supabase.com (se ainda nao tiver).
- [ ] No projeto atual: Project Settings > General > Transfer project >
      informar o email da conta dela.
- [ ] Ana Lucia aceita a transferencia pelo email recebido.
- [ ] O projeto continua igual (mesmo banco, mesmas tabelas, mesma URL,
      `cdfmmpgcpmqczfqvbxfh.supabase.co`) — so muda quem paga/administra.
- [ ] Pedir para a Ana Lucia me adicionar como colaborador no projeto
      (Project Settings > Team) para eu continuar trabalhando nele.
- [ ] Se a URL do projeto mudar por algum motivo, atualizar:
      - `docs/config.js` (`url`, `anonKey`, `functionsUrl`)
      - `SITE_URL` nos secrets, se o dominio do site tambem mudar junto

## Depois da transferencia dos dois

- [ ] Atualizar `SETUP_AUTH_PAGAMENTO.md` se algum passo de setup mudou.
- [ ] Confirmar que o `SITE_URL` nos secrets do Supabase aponta para o
      dominio definitivo (ver pergunta separada sobre dominio).
- [ ] Trocar as chaves do Stripe de teste (`sk_test_`/`pk_test_`) para
      producao (`sk_live_`/`pk_live_`) somente quando for cobrar de
      usuarios reais — repetir os passos de produto/preco/webhook tambem
      em modo live (cada modo tem sua propria configuracao, mesmo na
      mesma conta).
