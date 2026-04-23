---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: designer
feature_ref: F3 de [[../roles/designer]]
priority: P0
effort: M
---

# US-033 — Brand kit lock (paleta, fontes, logos travados)

## Como / Quero / Para que
**Como** designer,
**quero** que color picker e font picker mostrem apenas assets do brand kit da marca ativa,
**para que** a identidade visual da marca seja respeitada sem esforço mental.

## Contexto
Erro comum: designer usa cor "parecida" da marca mas não oficial. Brand kit lock elimina o atrito.

## Critérios de aceitação (Gherkin)

### Cenário 1: Color picker travado no kit
**Dado** que a marca "Acme Co" tem paleta [#2563EB, #DC2626, #F59E0B, #FFFFFF, #000000]
**Quando** abro color picker em qualquer camada
**Então** vejo as 5 cores como swatches principais
**E** opção "cor custom" aparece como secundária, abaixo de "Requer justificativa".

### Cenário 2: Cor custom requer justificativa
**Dado** que cliquei "cor custom"
**Quando** escolho #FF00FF e clico confirmar
**Então** modal pede "justificativa" (min 10 chars)
**E** salvando, a camada fica marcada `off_brand=true`
**E** aprovador vê badge "cor fora do kit" na revisão ([[US-051-fila-aprovacao-mobile]]).

### Cenário 3: Font picker só com fontes licenciadas
**Dado** que a marca tem fontes ["Inter", "Poppins"]
**Quando** abro font picker
**Então** vejo apenas "Inter" e "Poppins"
**E** fontes do sistema (Arial, etc) não aparecem.

### Cenário 4: Logo component com variações
**Dado** que o brand kit tem 3 variações de logo (horizontal, ícone, monocromático)
**Quando** abro library de assets
**Então** vejo as 3 variações em categoria "Logo"
**E** ao inserir, respeita padding mínimo configurado (ex: 20px de margem para o logo ícone).

### Cenário 5: Atualização do kit propaga
**Dado** que admin atualizou a cor primária de #2563EB para #1D4ED8
**Quando** abro um design que usa a cor primária
**Então** o sistema pergunta "Cor primária mudou — atualizar no design? (3 camadas afetadas)"
**E** posso aplicar em lote ou manter valor antigo.

### Cenário 6: Relatório de conformidade do design
**Dado** que finalizei um design
**Quando** clico "Verificar conformidade brand kit"
**Então** vejo report: "3/3 cores do kit · 1/1 fonte do kit · logo usado · 0 elementos off-brand"
**E** se qualquer erro, lista os elementos problemáticos.

## Dependências
- Backend: tabela `brand_kits` (brand_id, palette[], fonts[], logo_variants[], padding_rules_json).
- Frontend: overrides dos pickers, badge `off_brand` em camadas, report de conformidade.
- Externas: web fonts (via Supabase Storage ou Google Fonts quando licença permite).

## Fora de escopo
- Auto-correção de design off-brand (fase 2).
- Grafismos aprovados (template library em [[US-035-template-library]]).

## Links
- [[../roles/designer]]
- [[US-031-canvas-multiformato-presets-ig]]
- [[US-061-gestor-marcas-brandkit]]
