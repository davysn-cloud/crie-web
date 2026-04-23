---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: designer
feature_ref: F5 de [[../roles/designer]]
priority: P1
effort: M
---

# US-035 — Template library por pilar/campanha/marca

## Como / Quero / Para que
**Como** designer,
**quero** salvar designs como templates com variáveis substituíveis (título, CTA, imagem principal),
**para que** eu reuso estruturas comprovadas alterando só o conteúdo.

## Contexto
60%+ dos designs são estruturalmente similares dentro de uma marca. Templates transformam 30min em 5min de trabalho.

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar template a partir de design atual
**Dado** que tenho um design finalizado
**Quando** clico "Salvar como template" e dou nome "Dica educativa 4:5"
**Então** o template é salvo na library da marca
**E** modal pergunta "Quais camadas são variáveis?" permitindo marcar: título, CTA, imagem principal
**E** camadas marcadas ganham placeholders `{{titulo}}`, `{{cta}}`, `{{imagem}}`.

### Cenário 2: Usar template em novo design
**Dado** que estou no canvas vazio com pilar "Educativo"
**Quando** escolho template "Dica educativa 4:5" da sidebar
**Então** o canvas é preenchido com o template
**E** variáveis aparecem em form no painel direito
**E** editar o campo "título" propaga para a camada no canvas em tempo real.

### Cenário 3: Templates filtrados por pilar
**Dado** que o brief tem pilar "Educativo"
**Quando** abro library de templates
**Então** templates associados ao pilar "Educativo" aparecem primeiro
**E** outros pilares ficam em "Todos" (collapse).

### Cenário 4: Template compartilhado vs privado
**Dado** que criei um template
**Quando** marco "Compartilhar com a agência"
**Então** todos os designers da agência (em marcas compatíveis) podem usar
**E** sem marcar, template fica privado ao autor.

### Cenário 5: Versionamento de template
**Dado** que um template tem v3
**E** 8 designs usam esse template
**Quando** publico v4 do template
**Então** designs existentes permanecem em v3
**E** próximos usos do template carregam v4
**E** histórico de versões visível na página do template.

## Dependências
- Backend: tabela `templates` (id, brand_id nullable, name, pillar_id, scope enum private|agency, layers_json, variables_json, version, created_by). View `templates_by_pillar`.
- Frontend: sidebar de templates com busca, preview hover, form de variáveis.
- Externas: none.

## Fora de escopo
- Templates cross-marca (apenas escopo de agência/marca).
- Marketplace de templates (fase 3+).

## Links
- [[../roles/designer]]
- [[US-031-canvas-multiformato-presets-ig]]
- [[US-036-asset-library-tags]]
