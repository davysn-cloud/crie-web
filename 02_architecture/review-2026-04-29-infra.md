---
created: 2026-04-29
updated: 2026-04-29
owner: deploy
status: active
confidence: medium
---

# Review Infra/Deploy — 2026-04-29

Avaliação crítica da pilha de deploy/integrações sob ótica de **escala (100→1000 usuários), latência BR e custo**. Pré-beta. Stack atual: Vercel (SPA Vite) + Supabase (Postgres + Edge Functions Deno) + Stripe + Resend + Meta Graph + LLM (OpenAI/Anthropic, key por agência).

## 1. Vercel — **MANTER (com atenção a região e Pro upgrade)**
SPA estática + algumas chamadas a Edge Functions Supabase. Vercel é puro CDN para o build estático — bandwidth Hobby (100GB/mês) atende sub-100 usuários, mas **estoura na faixa de 200-300 agências ativas** (cada login carrega bundle ~500KB-1MB). Edge runtime da Vercel não é usado (todo backend está no Supabase). Latência BR: Vercel tem POP em GRU/São Paulo no edge global, então estático é ok. **Gatilho de upgrade Pro ($20/mês):** > 100GB BW/mês ou > 100 deploy preview/mês ou domínios white-label (Pro permite até 1000 domínios — Hobby não permite domínios custom programáticos via API).
Alternativa: **Cloudflare Pages** seria 30-50% mais barato em escala mas DX para Vite/preview é inferior. Não vale trocar agora.

## 2. Supabase região — **AÇÃO: confirmar `sa-east-1` (São Paulo)**
ICP é Brasil. `us-east-1` adiciona ~120ms RTT por query → impacto severo em apps com muita Edge Function fan-out (publish-worker, llm-brand-voice). **Não encontrei documentação explícita da região escolhida.** `sa-east-1` (GRU) é suportado pelo Supabase desde 2024. **Custo:** mesmo valor que outras regiões nos planos Pro+. **Gatilho:** se ainda estiver em us-east, migrar antes do beta com 5 agências (migração tardia exige restore de backup → downtime).

## 3. Stripe BR — **MANTER para Fase 3, MAS revisitar provider local em paralelo**
Stripe BR (Connect Brasil) suporta Pix/Boleto desde 2023 mas exige: CNPJ da empresa, MCC compatível, fluxo KYC longo (~2-4 semanas). Fees: **Pix 0.99% + R$0.39, Boleto 3.45% + R$3.45, cartão 4.99%**. Pagar.me/Asaas: Pix ~0.99%, sem fee fixo. Stark Bank: tarifas competitivas, API menos madura. **Veredito:** Stripe vale pelo ecossistema (webhooks, billing, invoices), mas dependendo do volume de Pix vs cartão, **Asaas** pode economizar 20-30% em transações pequenas. Recomendo construir o billing como interface abstrata desde já (não acoplar Stripe SDK direto ao domínio) para troca futura sem reescrita.

## 4. Resend — **MANTER (com white-label = upgrade necessário)**
Free 3k/mês — atende beta. **Pro $20/mês = 50k e-mails + multi-domínio** (necessário para white-label de agência: cada agência verifica seu próprio domínio para o magic link sair de `aprova@agencia.com.br`). Deliverability BR é boa (Resend usa AWS SES no backbone). Risco: rate limit 10 req/s no plano Pro — em campanha de 1000 magic links pode estourar; precisa fila com backoff. Alternativa: **AWS SES** custa 1/10 ($0.10/1000) mas templating + multi-tenant DKIM é DIY pesado. **Manter Resend, gatilho de troca: > $200/mês ou > 50 domínios verificados.**

## 5. Meta Graph API — **RISCO ALTO, AÇÃO necessária**
Cada agência conecta N páginas IG → cada `page_access_token` tem **rate limit por app** (BUC = Business Use Case): publishing tem cap de **200 calls/hora por usuário IG**. Insights: cap de **4800 calls/hora por app**. A 100 agências × 5 marcas × 4 posts/dia = 2000 publicações/dia → ok. Mas **insights-sync horário × 500 contas = 12k req/hora → estoura BUC**. **Ações:** (a) escalonar polling de insights (2-6h em vez de 1h), (b) usar **Meta Webhooks** para Insights/Comments quando disponível em vez de pull, (c) considerar **múltiplos Meta Apps** distribuindo agências (cada app tem seu cap). Risco extra: **App Review da Meta** pode levar 4-8 semanas para escalar permissões — começar **agora**.

## 6. LLM provider — **RISCO DE CUSTO se não houver controle de quota**
Modelo dual OpenAI/Anthropic com **API key da agência** (custo passa pra ela) — excelente decisão, isola explosão. Mas para feature de auto-adapt/copy: claude-3-5-sonnet a 100 agências × 50 gerações/dia × 1500 tok in + 800 tok out = ~$2.50/agência/mês ($250 total se nós pagarmos). **Ação:** (a) garantir métricas de tokens persistidas em `llm_usage` por agência, (b) implementar **prompt caching** (Anthropic suporta — economiza 90% no system prompt da brand voice), (c) cache de respostas idênticas (Redis ou tabela `llm_cache` com hash do prompt). **Gatilho:** se "Crie Free" com LLM nosso for parte do funil, mover para **Anthropic batch API** (50% off) ou **OpenAI gpt-4o-mini** ($0.15/1M in) como fallback.

## 7. CDN/imagens — **AÇÃO: avaliar Cloudflare R2 + Images**
Hoje Supabase Storage CDN (Cloudflare por baixo) — ok para MVP. Mas auto-adapt gera **4 variantes × 10 slides × 4 posts/agência/dia = 160 arquivos/agência/dia**. A 100 agências = 16k objetos/dia, 5MB médio = 80GB/dia → Supabase Storage Pro inclui 100GB; estoura no 2º dia. **Egress Supabase $0.09/GB → custo cresce rápido.** Alternativa: **Cloudflare R2 ($0.015/GB storage, egress grátis) + Images** para variantes on-the-fly. Economiza **~70%** em escala. Gatilho: > 500GB storage ou > 1TB egress/mês.

## 8. Observabilidade — **GAP CRÍTICO**
`pre-deploy.md` menciona Sentry como TODO ("se configurado"). **Nada está configurado hoje.** Necessário antes de beta:
- **Sentry frontend + Edge Functions** ($26/mês plano Team) — captura erros e perf;
- **Logs Edge Function** já vão pro Supabase Logs (incluído), mas retenção 1 dia em Free, 7d em Pro;
- **Axiom ou Logflare** para agregação cross-system + alertas customizados (publish queue stuck, rate limit Meta) — Axiom Free 500GB ingestion;
- **Better Stack** ($25/mês) para uptime + status page pública (importante para vender confiança a agência).

**Sem isso, beta é cego.** Prioridade máxima.

## 9. Custo estimado (mensal, ordem de grandeza)

| Item | 100 users (~20 agências) | 500 users (~100 agências) | 1000 users (~200 agências) |
|---|---|---|---|
| Vercel | $0 (Hobby) | $20 (Pro) | $20 + bandwidth ~$40 |
| Supabase | $25 (Pro) | $25 + add-ons ~$80 | $599 (Team) ou Pro + $300 add-ons |
| Resend | $20 (Pro) | $20 | $90 (Scale) |
| Stripe | ~3% GMV | ~3% GMV | ~3% GMV |
| Sentry/Axiom/BetterStack | $50 | $80 | $150 |
| LLM (se nosso, não da agência) | $50 | $300 | $700 |
| Cloudflare R2/Images (se migrado) | $10 | $40 | $100 |
| Meta Graph | $0 | $0 | $0 |
| **Total infra (sem GMV cut)** | **~$155** | **~$565** | **~$1700** |

**Estoura primeiro:** Supabase (DB compute + storage egress) e LLM (se subsidiarmos). Storage de imagens é o termômetro mais sensível.

## TOP 5 ações priorizadas

1. **Confirmar/migrar Supabase para `sa-east-1`** antes do beta (impacto direto em latência, irreversível barato agora). Owner: deploy. Prazo: pré-beta.
2. **Configurar Sentry + Axiom + BetterStack uptime** — sair do escuro antes de aceitar 5 agências piloto. Owner: deploy. Prazo: pré-beta.
3. **Submeter App Review Meta com permissions de produção** (`instagram_content_publish`, `pages_read_engagement`, `instagram_manage_insights`) — leva 4-8 semanas, bloqueia escala. Owner: backend + product. Prazo: imediato.
4. **Implementar prompt caching Anthropic + tabela `llm_usage` por agência** — controla explosão de custo e habilita billing por consumo no futuro. Owner: backend.
5. **Definir abstração de billing-provider antes de escrever Stripe SDK** + spike Asaas para comparativo de fees Pix. Owner: backend. Antes de Fase 3.

## Estimativa de custo a 100 / 500 usuários
- **100 usuários (~20 agências):** ~$155/mês infra + ~3% GMV em Stripe.
- **500 usuários (~100 agências):** ~$565/mês infra + ~3% GMV. Ponto de inflexão: Supabase add-ons (storage + compute upgrade).

## Links
- [[adr/deploy-target]]
- [[adr/billing-provider]]
- [[adr/transactional-email]]
- [[adr/008-agency-integrations-encryption]]
- [[adr/009-cron-runner]]
- [[adr/010-image-processing]]
