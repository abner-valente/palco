---
name: project-overview
description: "Stack, URLs, credenciais e arquitetura do Palco de Papéis"
metadata: 
  node_type: memory
  type: project
  originSessionId: bd404d86-a416-408c-b4e0-fc89d4e88691
  modified: 2026-08-21T19:03:13.109Z
---

# Palco de Papéis

Plataforma de teatro/psicodrama com palco virtual interativo onde o usuário posiciona peças geométricas.

## URLs
- Produção: https://palcodepapeis.com.br
- GitHub Pages com Vite, base: '/'

## Stack
- Frontend: Vite + JS puro (sem framework)
- Auth + DB: Supabase
- Pagamentos: Stripe (modo produção, live keys)
- Email transacional: Resend SMTP (domínio verificado: palcodepapeis.com.br)
- DNS: Cloudflare
- Deploy: GitHub Pages (branch main → pasta dist/)

## Arquivos principais
- src/app.js — lógica do palco (peças, paleta, layout)
- src/auth.js — autenticação, paywall, perfil, menu
- src/main.js — entry point
- docs/style.css — estilos globais
- index.html — HTML principal
- supabase/functions/ — Edge Functions (create-checkout-session, stripe-webhook)

## Supabase
- Project ref: cdfmmpgcpmqczfqvbxfh
- URL: https://cdfmmpgcpmqczfqvbxfh.supabase.co
- Tabelas: subscriptions, profiles, sessions, alerts
- View de monitoramento: public.user_status (email, created_at, email_confirmed_at, subscription_status) em horário de Brasília
- DB password: 123456
- CLI vinculado: supabase link --project-ref cdfmmpgcpmqczfqvbxfh

## Stripe
- Modo: produção (live)
- Produto: Palco de Papéis — R$ 1,00/mês
- Price ID: price_1Tn4vpFlXUVSoEasgxJVZmHz
- Webhook: https://cdfmmpgcpmqczfqvbxfh.supabase.co/functions/v1/stripe-webhook

## Resend
- SMTP: smtp.resend.com porta 465, username: resend
- Sender: noreply@palcodepapeis.com.br
- Domínio verificado em 20/08/2026

## Contas admin com acesso gratuito
- Inserir manualmente na tabela subscriptions com status 'active'

## Suporte WhatsApp
- https://wa.me/556798813139

## Git
- Branch principal: main (produção)
- Branch desenvolvimento: dev
- Repositório: privado no GitHub
