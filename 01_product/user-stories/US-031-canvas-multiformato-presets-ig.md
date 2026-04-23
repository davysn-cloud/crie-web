---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: designer
feature_ref: F1 de [[../roles/designer]]
priority: P0
effort: XL
---

# US-031 — Canvas multiformato com presets Instagram e safe zones

## Como / Quero / Para que
**Como** designer,
**quero** abrir um canvas com presets travados nas dimensões corretas (Story 1080×1920, Feed 1:1 1080×1080, Feed 4:5 1080×1350, Feed 1.91:1 1080×566, Reel cover) com overlays de safe zone,
**para que** eu nunca crie arte com dimensão errada e respeite as áreas cortadas pela UI do IG.

## Contexto
Base de todo o painel do designer. Presets são imutáveis (dimensões oficiais IG). Safe zones são toggleáveis.

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar novo canvas com preset
**Dado** que estou no painel do designer
**Quando** clico "Novo canvas" e escolho preset "Story/Reel 1080×1920"
**Então** o canvas abre com exatamente 1080×1920 pixels
**E** a dimensão não pode ser alterada livremente (só troca de preset)
**E** zoom inicial ajusta para caber na tela com margem 5%.

### Cenário 2: Safe zones da Story visíveis
**Dado** que estou no canvas Story 1080×1920 com overlay "safe zones" ativo
**Quando** olho a tela
**Então** vejo retângulo tracejado vermelho no top 250px (área do profile pic + nome)
**E** retângulo tracejado vermelho no bottom 350px (área de CTA/reply)
**E** label "safe zone" em cada retângulo.

### Cenário 3: Troca de preset preserva camadas
**Dado** que tenho um canvas Feed 1:1 com 4 camadas
**Quando** troco para preset Feed 4:5
**Então** o canvas redimensiona para 1080×1350
**E** as 4 camadas permanecem, centralizadas no novo canvas
**E** o sistema pergunta "Reposicionar camadas automaticamente?" (usa [[US-032-auto-adapt-master-variantes]]).

### Cenário 4: Preview com profile pic sobreposta (Story)
**Dado** que estou em canvas Story
**Quando** ativo toggle "Preview com UI do IG"
**Então** vejo mock da profile pic circular no canto superior esquerdo (56px)
**E** nome do perfil ao lado
**E** timer da Story no topo.

### Cenário 5: Preset Reel cover com área crop do feed
**Dado** que escolhi preset "Reel cover"
**Quando** vejo o canvas
**Então** dimensão total 1080×1920
**E** overlay marcando a área 1080×1350 central (o que aparece quando Reel é listado no feed/grid)
**E** aviso "Elementos essenciais da capa devem ficar dentro desta área".

### Cenário 6: Bloqueio de formato customizado
**Dado** que tento inserir dimensão "800×1000"
**Quando** digito no input
**Então** o sistema bloqueia
**E** mensagem "Use um dos presets Instagram para garantir publicação válida".

## Dependências
- Backend: tabela `designs` (id, post_id, format, width, height, layers_json, master_id). Supabase Storage `designs/`.
- Frontend: canvas (fabric.js, konva.js ou shadcn + custom), overlays toggleáveis, troca de preset.
- Externas: none.

## Fora de escopo
- Edição colaborativa simultânea (fase 2 — Yjs/Liveblocks).
- Presets não-Instagram (LinkedIn, TikTok — fase 3+).

## Links
- [[../roles/designer]]
- [[US-032-auto-adapt-master-variantes]]
- [[US-038-story-reel-ui-overlay]]
