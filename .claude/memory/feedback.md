---
name: feedback
description: Orientações e preferências de como trabalhar com este usuário
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bd404d86-a416-408c-b4e0-fc89d4e88691
  modified: 2026-08-21T19:03:30.470Z
---

# Preferências de trabalho

Testar localmente antes de dar push. O usuário prefere validar no localhost antes de qualquer deploy.
**Why:** Evitar bugs em produção que afetam usuários reais.
**How to apply:** Sempre sugerir `npm run dev` antes de `git push`.

PowerShell usa `;` e não `&&` para encadear comandos.
**Why:** PowerShell não suporta `&&` como operador de encadeamento.
**How to apply:** Em todos os comandos shell para este usuário, usar `;` no PowerShell ou usar o Bash tool para comandos Unix.

Usuário prefere testar mudanças visuais no localhost antes de commitar.
**Why:** Design é iterativo — vários ajustes pequenos antes de chegar no resultado final.
**How to apply:** Não sugerir git push até o usuário confirmar que está satisfeito.
