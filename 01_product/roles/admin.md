---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: active
confidence: high
---

# Painel do Admin da Agência

## Persona
Dono / gerente de operações da agência. Gere marcas, time, permissões, billing. Não produz conteúdo no dia a dia — **faz o time funcionar.**

## Jobs-to-be-done
- Onboardar novas marcas (clientes) em minutos.
- Montar times por marca com permissões corretas.
- Saber quanto conteúdo está sendo entregue e por quem.
- Gerir billing sem surpresas.
- Customizar a experiência do cliente (white-label).

## Layout do painel
**Hero:** dashboard de saúde da operação (KPIs do mês: posts criados / aprovados / publicados por marca).
**Navegação:** marcas · time · permissões · billing · white-label · audit log.

## Funcionalidades

### F1 — Gestor de marcas (clientes)
- Criar marca com: nome, logo, brand kit inicial (cores, fontes), handle do Instagram, fuso horário, pilares default (ou vazio).
- Arquivar marca (não deleta — desativa, preserva histórico).
- Métricas por marca: posts no mês, % aprovação em v1, tempo médio de aprovação.

### F2 — Time e atribuição por marca
- Convidar membros (e-mail) com role padrão: `strategist`, `copywriter`, `designer`, `social_media`, `admin`.
- Atribuir membros por marca (um copywriter pode estar em 3 marcas, outro só em 1).
- **Aprovadores (clientes)** são cadastrados separadamente (não contam como seat de time) — só recebem magic link.

### F3 — Permissões granulares
Matriz role × ação × escopo (marca):
| Ação | strategist | copy | design | social | admin |
|---|---|---|---|---|---|
| Criar brief | ✅ | ❌ | ❌ | ❌ | ✅ |
| Editar copy | ❌ | ✅ | ❌ | ❌ | ✅ |
| Editar arte | ❌ | ❌ | ✅ | ❌ | ✅ |
| Agendar publicação | ❌ | ❌ | ❌ | ✅ | ✅ |
| Aprovar internamente | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publicar para cliente | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver billing | ❌ | ❌ | ❌ | ❌ | ✅ |

Permissões de leitura são por marca (membro só vê marcas que foi atribuído).

### F4 — Usage dashboard
- KPIs agregados: posts no mês (por marca, total), % aprovado em v1, tempo médio por etapa (brief→copy, copy→design, design→aprovação), backlog pendente.
- Ranking de marcas mais/menos ativas.
- Export CSV para report cliente.

### F5 — Billing & plano
- Plano por seats (membros de time) + número de marcas.
- Limites do plano visíveis (ex: "3/5 marcas usadas").
- Upgrade/downgrade in-app via **Stripe** (ou Lemon Squeezy — decisão pendente: [[../../02_architecture/adr/billing-provider]]).
- Faturas e histórico.

### F6 — White-label
- Subdomínio customizável (ex: `cliente.agencia.com` via CNAME ou `agencia.crieweb.com`).
- Logo e cor primária no **portal do aprovador** (não na app da agência).
- E-mail from-address custom (com SPF/DKIM da agência — setup guiado).
- Rodapé discreto "powered by crie-web" (remover só em plano enterprise).

### F7 — Magic link management
- Lista de aprovadores ativos por marca com último acesso.
- Revogar link / re-emitir.
- Limite de links por marca (evitar abuso).

### F8 — Audit log
- Log imutável: quem criou / editou / aprovou / publicou o quê e quando.
- Filtro por membro, marca, ação, período.
- Export para compliance.

### F9 — Integrações
- Conectar conta Instagram Business de cada marca (OAuth Meta).
- Chaves de API (Resend, Stripe, LLM) ficam em nível de agência (não por marca).

### F10 — Onboarding guiado
Ao criar a agência, checklist de setup:
1. Brand kit da primeira marca.
2. Conectar IG Business.
3. Convidar 1º membro de time.
4. Cadastrar 1º aprovador.
5. Criar 1º brief.
Barra de progresso visível até completar.

## Integrações
- **Stripe** ou **Lemon Squeezy** (billing).
- **Meta Graph API** (OAuth para conectar contas IG).
- **Resend** ou similar (e-mail transacional white-label).

## Handoffs
- **Entrada:** nova agência / nova marca / novo membro.
- **Saída:** habilita todos os outros painéis para o time.

## Métricas de sucesso do painel
- Tempo de "criar agência → primeiro brief criado" < 30 min.
- Churn voluntário mensal < 3%.
- 0 incidentes de permissão indevida (membro vendo marca que não deveria).

## User stories relacionadas
- A definir (US-061+).

## Links
- [[README|índice de roles]]
- [[../../02_architecture/adr/billing-provider]]
- [[../../03_backend/auth|auth flows]]
