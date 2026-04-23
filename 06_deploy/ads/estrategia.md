---
created: 2026-04-19
updated: 2026-04-19
owner: ads
status: active
confidence: medium
---

# Estrategia de Trafego Pago — crie-web

**Objetivo:** Gerar leads qualificados (trials) para o beta fechado do crie-web.
**Budget inicial sugerido:** R$30-50/dia (R$900-1500/mes)
**Referencia:** [[../../01_product/icp]], [[../landing/landing-page-copy]]

---

## Principios

1. **Intencao primeiro** — Google Search (quem busca) antes de Meta (quem scrolls). ROI imediato maior.
2. **Budget pequeno, aprendizado rapido** — R$30/dia, 2 semanas, analise, ajuste, escala.
3. **Conversao > clique** — otimizar para trial_signup, nao para clique. Pixel + evento de conversao obrigatorios.
4. **Consistencia** — mensagem do anuncio = mensagem da landing page. Sem bait-and-switch.

---

## Campanha 1: Google Search — Non-Brand (Prioridade 1)

**Objetivo:** Capturar intencao de busca de agencias procurando solucao.
**Budget:** R$20-30/dia

### Estrutura

| Item | Detalhe |
|---|---|
| Tipo | Search (Responsive Search Ads) |
| Objetivo | Conversoes (trial_signup) |
| Segmentacao | Brasil, portugues |
| Audiencia | Observation mode: "Agencias de marketing", "Servicos empresariais" |
| Dispositivo | Todos (mobile + desktop), ajustar lance se mobile converter menos |
| Programacao | Segunda a sexta, 8h-20h (horario comercial — decision makers) |
| Landing page | Landing page do beta (formulario de inscricao) |

### Grupos de anuncio

**Ad Group 1: "Aprovacao de conteudo"**
- Keywords: "ferramenta aprovacao conteudo", "aprovacao de posts agencia", "plataforma aprovacao conteudo", "workflow aprovacao social media"
- Match: Phrase + Exact

**Ad Group 2: "Gestao agencia"**
- Keywords: "ferramenta gestao redes sociais agencia", "software gestao agencia marketing", "plataforma gestao conteudo agencia"
- Match: Phrase

**Ad Group 3: "Alternativa concorrentes"**
- Keywords: "alternativa mlabs", "alternativa planable", "planable em portugues", "mlabs aprovacao"
- Match: Exact

### KPIs alvo

| Metrica | Alvo |
|---|---|
| CPC | < R$3,00 |
| CTR | > 3% |
| Taxa conversao (clique → trial) | > 5% |
| CPA (custo por trial) | < R$50 |

---

## Campanha 2: Meta Ads — Retargeting (Prioridade 2)

**Objetivo:** Recapturar visitantes da landing page que nao converteram.
**Budget:** R$10-15/dia
**Pre-requisito:** Meta Pixel instalado na landing page + evento de conversao configurado.

### Estrutura

| Item | Detalhe |
|---|---|
| Tipo | Conversoes |
| Posicionamento | Feed Instagram + Feed Facebook + Stories Instagram |
| Audiencia | Custom Audience: visitantes da landing page nos ultimos 30 dias que NAO converteram |
| Exclusao | Quem ja fez trial_signup |
| Frequencia | Max 3 impressoes/pessoa/semana |

### Ad Sets

**Ad Set 1: "Lembrete direto"**
- Creative: imagem do kanban do crie-web + headline de dor
- Copy: curta, urgencia real ("vagas limitadas no beta")

**Ad Set 2: "Social proof"**
- Creative: depoimento de agencia piloto (quando disponivel) ou screenshot da plataforma
- Copy: resultado/beneficio especifico

### KPIs alvo

| Metrica | Alvo |
|---|---|
| CPC | < R$1,50 (retargeting e mais barato) |
| CTR | > 1,5% |
| Taxa conversao | > 8% (publico quente) |
| Frequencia | < 3/semana |

---

## Campanha 3: Meta Ads — Lookalike / Prospeccao (Prioridade 3)

**Quando ativar:** Apos ter 50+ visitantes na landing page (base para lookalike) OU lista de emails de agencias.
**Budget:** R$15-20/dia (quando ativar)

### Estrutura

| Item | Detalhe |
|---|---|
| Tipo | Conversoes |
| Posicionamento | Feed Instagram + Feed Facebook |
| Audiencia | Lookalike 1% de: visitantes da LP, OU lista de emails de agencias (upload CSV) |
| Interesse (layering) | "Marketing digital", "Gestao de redes sociais", "Empreendedorismo" |
| Cargo (se disponivel) | "Dono de empresa", "Marketing manager", "Social media" |
| Idade | 25-50 |

### Ad Variations

Minimo 3 variacoes de creative:
1. **Dor:** "Sua agencia ainda aprova posts pelo WhatsApp?"
2. **Beneficio:** "Todos os clientes em uma tela. Aprovacao com um clique."
3. **Demo:** Video/GIF de 15s mostrando o produto

### KPIs alvo

| Metrica | Alvo |
|---|---|
| CPM | < R$30 |
| CPC | < R$2,50 |
| CTR | > 1% |
| Taxa conversao | > 3% |
| CPA | < R$80 |

---

## O que NAO fazer agora (pos-beta)

| Canal | Por que adiar |
|---|---|
| LinkedIn Ads | CPC muito alto (R$15-30). So faz sentido com LTV validado. |
| YouTube Ads | Precisa de video de qualidade. Investir apos ter cases. |
| Google Display (prospeccao) | Baixa intencao, alto volume de cliques irrelevantes. |
| Programatica | Complexidade excessiva para o estagio atual. |

---

## Setup tecnico obrigatorio (antes de rodar ads)

- [ ] Landing page no ar com formulario funcional
- [ ] Meta Pixel instalado e testado (PageView + Lead event)
- [ ] Google Tag Manager configurado
- [ ] Google Ads conversion tracking (trial_signup)
- [ ] GA4 com evento de conversao
- [ ] UTM parameters padronizados: `?utm_source=google&utm_medium=cpc&utm_campaign=search-aprovacao`
- [ ] Pagina de obrigado pos-inscricao (para trackear conversao)

---

## Cronograma de lancamento

| Semana | Acao |
|---|---|
| S1 | Setup tecnico (pixel, GTM, eventos, UTMs) |
| S1 | Campanha 1 (Google Search non-brand) — budget conservador R$30/dia |
| S2 | Analisar dados de S1. Ajustar keywords, negativar, otimizar |
| S2 | Campanha 2 (Meta retargeting) — R$10/dia |
| S3 | Se Google Search converter: aumentar budget para R$50/dia |
| S4 | Campanha 3 (Meta lookalike) — se tiver base suficiente |
| S4 | Primeiro relatorio de performance completo |

---

## Budget total estimado (primeiro mes)

| Campanha | Budget diario | Budget mensal |
|---|---|---|
| Google Search non-brand | R$30 | R$900 |
| Meta retargeting | R$10 | R$300 |
| Meta lookalike (S3-S4) | R$15 (15 dias) | R$225 |
| **Total** | **~R$50/dia** | **~R$1.425/mes** |

## Links

- [[palavras-chave]]
- [[copy-anuncios]]
- [[../landing/landing-page-copy]]
- [[../../01_product/icp]]
