---
created: 2026-04-29
updated: 2026-04-29
owner: deploy
status: active
confidence: high
---

# Review crítico — Infra / Deploy / Integrações (2026-04-29)

Escopo: avaliação sob ótica de **escala (100 → 1k usuários), latência BR e custo**. Pré-beta.

## 1. Vercel — **AJUSTAR (Pro a partir do beta público)**
- Hobby suficiente para 5 agências piloto (100 GB-h functions, 100 GB bandwidth). Para beta público vai estourar bandwidth (assets + react bundle ~1MB sem code-split — ver review frontend).
- **Região BR (gru1) só disponível no Pro+** ($20/mês/seat). No Hobby tudo serve dos US/EU → +120-180ms RTT por requisição estática para Brasil.
- Edge functions: 1M invocations/mês Pro. Se mantivermos o image-pipeline no Supabase (e mantemos), Vercel só serve SPA + API thin → folgado.
- **Veredito**: Hobby até final do beta fechado; **gatilho upgrade Pro = primeiro cliente pagante OU bandwidth >70 GB/mês**. Configurar `gru1` como primary region depois.
- Alternativa Cloudflare Pages: 50% mais barato em escala mas DX pior para preview deploys e Vite SPA — não compensa antes de 1k users.

## 2. Supabase — **AJUSTAR (confirmar `sa-east-1` antes do primeiro cliente)**
- Não está documentado em qual região o projeto vive. Em `us-east-1` cada query do Brasil tem ~140ms RTT — para um app com Realtime + lots-of-RPC isso é UX ruim.
- **Ação**: confirmar no dashboard. Se for `us-east-1`, **migrar para `sa-east-1` (São Paulo) AGORA**, antes de ter dados reais. Migração depois custa downtime.
- Plano Pro ($25/mês) já é necessário para `pg_cron` confiável, branching, daily backups 7d e 8GB DB. **Free tier não suporta beta** (paused após 1 semana de inatividade).
- Storage egress: Pro inclui 250GB/mês — para 100 agências × 50 posts/mês × 4 formatos × 2MB = 40 GB/mês — folgado. A 1k agências (400GB) estoura → **Cloudflare R2 + custom domain como CDN para `post-assets`** (gatilho: 200GB/mês).

## 3. Stripe BR — **MANTER, com abstração defensiva**
- Pix/Boleto via Stripe BR já saiu de beta mas exige CPF/CNPJ no Customer e MCC adequado. Settlement em BRL via Payouts (T+2). Funciona, **mas** taxa Pix 1.99% + R$0.39 é ~2x Pagar.me/Asaas (0.99-1.49%).
- Risco maior: emissão de NFSe — Stripe não emite. Já previsto via NFe.io.
- **Veredito**: manter Stripe (já aceito em ADR), mas **encapsular em `BillingProvider` interface** antes de escrever o webhook concreto, para podermos plugar Asaas se a fricção CPF + custo Pix doer pós-beta. **Gatilho swap = >50 cobranças Pix/mês ou churn por fricção checkout**.

## 4. Resend — **MANTER**
- Free tier (3k/mês, 100/dia) cobre beta fechado. Pro $20/mês = 50k → cobre 500 agências sem stress.
- Deliverability BR ok com SPF/DKIM/DMARC configurados no domínio próprio. White-label multi-domínio nativo é a feature-killer aqui.
- **Risco**: 100/dia limit do free + magic link de aprovador (caminho crítico). **Ação imediata**: subir para Pro antes do primeiro piloto com volume real (gatilho: 2ª agência ativa).
- Alternativas (Postmark/SES): SES barato mas DX e templates péssimos; Postmark caro. Manter Resend.

## 5. Meta Graph API — **AJUSTAR (App Review é o caminho crítico)**
- Rate limit por app: 200 calls/hora/usuário (BUC); por IG account ~4800 impressions/24h. Para 100 agências × ~10 contas IG × publish + insights/h = ~1k chamadas/h → confortável **se publicarmos como o usuário da agência (cada um com seu quota)**.
- **Risco real não é rate limit, é App Review.** Permissões `instagram_content_publish`, `pages_manage_posts`, `pages_read_engagement` exigem app review com vídeo de demo + privacy policy + business verification. **Ciclo típico: 2-4 semanas, 1-3 rounds de rejeição**. Sem isso, só usuários listados como testers conseguem usar — bloqueia beta público.
- **Ação imediata**: submeter App Review **agora** (paralelamente ao desenvolvimento). É o long-pole do beta.
- Insights via webhook (Page Webhook) reduz polling — implementar no `insights-sync` Fase 2.

## 6. LLM provider — **DEFINIR (gap)**
- Não há ADR explícita escolhendo OpenAI vs Anthropic. ADR 008 menciona "API key da agência" — modelo BYOK reduz nosso custo, **mas** complica onboarding (agência precisa criar conta e billing num provider técnico).
- Estimativa custo nosso (se centralizarmos) a 100 agências × 30 brand voice/mês × 3k tokens input + 1k output com Claude Sonnet 4: ~$0.012/req × 3000 = **~$36/mês**. Com Haiku ~$5/mês. Trivial. A 1k agências = ~$360/mês — ainda ok.
- **Recomendação**: **híbrido** — pool nosso (Anthropic Claude Haiku para quick tasks, Sonnet para brand-voice rigorous) com cota mensal por plano; agência pode plugar BYOK pra tirar limite. Implementar **prompt caching** (Anthropic) → -70% input tokens em brand voice (system prompt longo é repetitivo).
- Quota e rate per-agency: tabela `agency_llm_usage` + middleware no Edge Function. **Falta** — abrir story.

## 7. CDN / imagens — **AJUSTAR (curto prazo: Supabase Storage CDN; médio: R2)**
- Supabase Storage já entrega via CDN (Cloudflare-fronted). Latência BR aceitável.
- Sem image transformation pipeline servido via CDN — a Edge Function `auto-adapt` gera variantes mas o frontend pede o asset cru. Para grid IG do publisher (mosaicos pequenos), servir 2MB de thumbnail é desperdício.
- **Ação curto prazo (P1)**: usar Supabase Storage `image transformations` (resize via query param) para thumbnails. **Gratuito até 100 origin images** no Pro.
- **Médio prazo (1k users)**: migrar `post-assets` para Cloudflare R2 + Workers para AVIF/WebP on-the-fly. R2 = zero egress fee, ~$0.015/GB-storage. **Gatilho: bandwidth Supabase >150 GB/mês**.

## 8. Observabilidade — **CRÍTICO (zero hoje)**
Não há **nada** configurado: sem Sentry, sem tracing, sem alertas, sem uptime. Voando cego. Inaceitável para beta com clientes pagantes.
- **Mínimo viável antes do 1º piloto**:
  - **Sentry** (frontend + Edge Functions Deno) — free tier 5k errors/mês.
  - **Axiom** ou **Logflare** para logs estruturados das Edge Functions (Supabase logs são limitados a 1d no Pro). Axiom free 500GB/mês.
  - **BetterStack Uptime** — ping de `/healthz` (Edge Function trivial) + `app.crieweb.com.br`. Free 10 monitors.
  - Alertas de `cron.job_run_details` com falha (query Supabase + webhook Slack/Discord).
- Custo: **$0** no início (todos free), ~$50/mês quando saturar.

## 9. Custo total estimado (USD/mês, ordem de grandeza)

| Item                | 100 users | 500 users | 1000 users |
|---------------------|----------:|----------:|-----------:|
| Vercel              | 0 (Hobby) | 20 (Pro)  | 60 (Pro+seats) |
| Supabase            | 25        | 100 (Pro+addons) | 250 (Team) |
| Resend              | 20        | 20        | 80 |
| Stripe              | (% rev)   | (% rev)   | (% rev) |
| Meta Graph          | 0         | 0         | 0 |
| LLM (Anthropic)     | 40        | 200       | 400 |
| Storage egress extra| 0         | 50 (R2)   | 150 (R2) |
| Observabilidade     | 0         | 50        | 100 |
| **Total infra**     | **~$85**  | **~$440** | **~$1040** |

**Bottleneck primeiro a estourar**: storage egress + LLM (se subsidiarmos). Ação preventiva: BYOK opcional + R2 quando passar de 200 GB/mês.

## TOP 5 ações priorizadas
1. **Confirmar/migrar Supabase para `sa-east-1`** (Coordinator + Deploy, esta semana). Bloqueador: latência BR.
2. **Submeter Meta App Review agora** (Backend agent, esta semana). Long-pole de 2-4 semanas — sem ele não há beta público.
3. **Setup observabilidade mínima**: Sentry + Axiom + BetterStack + alerta de cron failure (Deploy, antes do 1º piloto). Gratuito hoje.
4. **Decidir LLM provider + implementar quota + prompt caching** (Backend agent, 1 ADR pendente). Sem isso o custo escala fora de controle.
5. **Abstrair `BillingProvider`** antes de implementar Stripe SDK (Backend agent). Se Pix Stripe doer, swap pra Asaas em <1 semana.

## Estimativa de custo
- **100 usuários**: ~$85/mês infra + transação Stripe sobre receita.
- **500 usuários**: ~$440/mês infra. Bottleneck: LLM (se centralizado) e Supabase egress.
- Margem confortável: cobrar mínimo R$199/agência/mês → 100 agências = R$19.9k MRR vs ~R$425 de infra (≈2% COGS infra).
