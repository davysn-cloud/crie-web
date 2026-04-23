---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: copywriter
feature_ref: F9 de [[../roles/copywriter]]
priority: P0
effort: M
---

# US-029 — Versionamento de legenda com diff visual

## Como / Quero / Para que
**Como** copywriter,
**quero** que cada edição gere uma versão nova com diff visual lado-a-lado e marca "aprovado" congelada,
**para que** eu acompanhe mudanças e não perca a versão aprovada por edição acidental.

## Contexto
Crítico para o fluxo de aprovação. Cliente aprova uma versão específica — edição após aprovação cria nova versão (não sobrescreve).

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar versão a cada save
**Dado** que edito a legenda e pauso por 30s
**Quando** o autosave dispara
**Então** uma nova versão é criada em `post_versions` com timestamp e autor
**E** versões idênticas (mesmo conteúdo) não geram nova versão (dedup por hash).

### Cenário 2: Histórico de versões visível
**Dado** que o post tem 7 versões
**Quando** abro "Histórico"
**Então** vejo lista cronológica: v7 (atual), v6 (cliente pediu ajuste), v5 (aprovada)... v1
**E** versão aprovada tem ícone cadeado
**E** clique em qualquer versão abre modo visualização (read-only).

### Cenário 3: Diff visual entre duas versões
**Dado** que seleciono v5 e v7
**Quando** clico "Comparar"
**Então** vejo painel dividido: esquerda v5, direita v7
**E** adições em verde, remoções em vermelho (git-style)
**E** char count de ambas visível.

### Cenário 4: Congelar versão ao aprovar
**Dado** que o cliente aprovou v5
**Quando** o sistema registra aprovação
**Então** v5 ganha flag `is_approved=true` e `approved_at`
**E** copywriter não pode editar v5 diretamente (ver Cenário 5).

### Cenário 5: Edição após aprovação cria nova versão
**Dado** que v5 está aprovada
**Quando** o copywriter edita o texto
**Então** uma v6 é criada como `edited_after_approval=true`
**E** aviso amarelo no topo: "Versão aprovada era v5 — v6 precisará de nova aprovação"
**E** status do post volta para `pending_review`.

### Cenário 6: Reverter para versão antiga
**Dado** que estou vendo v3 no histórico
**Quando** clico "Usar esta versão"
**Então** uma v8 é criada copiando o conteúdo de v3
**E** v3 não é deletada, mantém auditoria.

## Dependências
- Backend: tabela `post_versions` (id, post_id, content_hash, caption, emoji_count, char_count, author_id, is_approved, approved_at, created_at). View `post_version_history`.
- Frontend: componente `<DiffViewer />` (pode usar `react-diff-viewer`), timeline de versões.
- Externas: none.

## Fora de escopo
- Diff de arte (responsabilidade do [[US-040-version-lock-designer]]).

## Links
- [[../roles/copywriter]]
- [[US-056-historico-post-timeline]]
- [[US-040-version-lock-designer]]
