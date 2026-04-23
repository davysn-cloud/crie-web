---
created: 2026-04-15
updated: 2026-04-15
owner: deploy
status: accepted
confidence: high
decided_on: 2026-04-15
---

# ADR — Deploy Target

## Contexto
App é Vite SPA + Supabase. Precisamos de hosting simples com preview deploys por PR, custom domain e boa integração com GitHub.

## Decisão
**Vercel.**

## Justificativa
- Zero config para Vite (preset nativo).
- Preview deploy automático por PR → cliente consegue ver antes de merge.
- Custom domain + Let's Encrypt automático.
- Edge runtime disponível se precisarmos além das Supabase Edge Functions.
- Plano Hobby atende MVP; upgrade gradual.

## Consequências
- Frontend (SPA) deployado na Vercel; backend (Edge Functions, DB) no Supabase.
- Env vars do frontend (prefixo `VITE_`) configuradas na Vercel — **nunca** secrets do backend.
- Domínios white-label (subdomínios custom por agência no Fase 2) via **Vercel Domains API** + CNAME.
- Analytics via Vercel Analytics (gratuito, sem cookies) → atende LGPD.

## Alternativas consideradas
- Netlify — equivalente, sem vantagem clara.
- Cloudflare Pages — mais barato em escala mas DX pior para Vite + preview.
