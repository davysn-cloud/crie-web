---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: admin
feature_ref: F1 de [[../roles/admin]]
priority: P0
effort: M
---

# US-061 — Cadastro e arquivo de marcas com brand kit

## Como / Quero / Para que
**Como** admin da agência,
**quero** cadastrar nova marca com nome, logo, brand kit inicial (paleta, fontes), handle IG, timezone, pilares default — ou arquivar sem deletar,
**para que** eu onboarding cliente novo em <5min e preserve histórico.

## Contexto
Base do multi-tenant. Brand kit aqui alimenta [[US-033-brand-kit-lock]] do designer.

## Critérios de aceitação (Gherkin)

### Cenário 1: Cadastrar marca nova
**Dado** que sou admin e tenho permissão "criar marca"
**Quando** clico "Nova marca" e preencho: nome "Luna Corp", logo upload, paleta (3 cores mínimo), fontes (≥1), handle IG "@lunacorp", timezone "America/Sao_Paulo"
**E** clico "Criar"
**Então** marca é criada com slug `luna-corp`
**E** fica disponível para atribuir membros do time (ver [[US-062-atribuir-membros-marcas]])
**E** se é a primeira marca da agência, checklist de onboarding guiado aparece (brand kit → conectar IG → convidar 1º membro → cadastrar 1º aprovador → criar 1º brief) com barra de progresso.

### Cenário 2: Validação de handle IG
**Dado** que já existe marca com handle `@lunacorp`
**Quando** tento criar outra com mesmo handle
**Então** validação inline "Handle já usado em outra marca"
**E** criação bloqueada.

### Cenário 3: Pilares default opcionais
**Dado** que estou cadastrando marca
**Quando** preencho "Pilares sugeridos" com 4 pilares padrão
**Então** a marca é criada com esses pilares já configurados
**E** pode deixar vazio — estrategista configura depois.

### Cenário 4: Arquivar marca preserva dados
**Dado** que marca "X" tem 50 posts históricos
**Quando** clico "Arquivar" e confirmo
**Então** status vira `archived`
**E** marca some do seletor dos membros
**E** dados históricos (posts, insights, aprovações) permanecem acessíveis em "Arquivadas"
**E** não conta no limite de marcas do plano.

### Cenário 5: Desarquivar
**Dado** que marca está arquivada
**Quando** clico "Desarquivar"
**Então** volta a status `active`
**E** respeita limite do plano (ex: plano 5 marcas — se já tem 5 ativas, bloqueia).

### Cenário 6: Métricas por marca
**Dado** que marca está ativa há 30 dias
**Quando** abro detalhes
**Então** vejo: posts criados (28), % aprovado em v1 (78%), tempo médio aprovação (14h)
**E** gráfico de tendência 30 dias.

### Cenário 7: Limite do plano enforced
**Dado** que plano é "Starter" (3 marcas)
**E** já tenho 3 ativas
**Quando** tento criar 4ª
**Então** bloqueio com "Limite do plano Starter (3 marcas) — faça upgrade"
**E** link para [[US-065-billing-plano-stripe]].

## Dependências
- Backend: tabela `brands` (id, agency_id, name, slug, logo_url, handle_ig, timezone, archived_at, created_at). Tabela `brand_kits` (FK). RLS.
- Frontend: form de criação, upload de logo, color picker paleta, font picker, lista de marcas.
- Externas: none.

## Fora de escopo
- Importar brand kit de arquivo Figma (fase 2).

## Links
- [[../roles/admin]]
- [[US-033-brand-kit-lock]]
- [[US-062-atribuir-membros-marcas]]
- [[US-068-conectar-instagram-oauth]]
