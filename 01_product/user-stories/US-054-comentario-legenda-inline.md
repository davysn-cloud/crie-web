---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: aprovador
feature_ref: F3 de [[../roles/aprovador]]
priority: P1
effort: M
---

# US-054 — Comentário inline na legenda (track changes)

## Como / Quero / Para que
**Como** aprovador,
**quero** selecionar texto da legenda e sugerir alteração (modelo tipo Google Docs track changes),
**para que** o copywriter aceite ou rejeite mudanças pontuais sem reler a legenda inteira.

## Contexto
Legenda tem até 2200 chars. Feedback livre "trocar a terceira frase" é frustrante. Seleção direta resolve.

## Critérios de aceitação (Gherkin)

### Cenário 1: Selecionar texto e sugerir
**Dado** que estou vendo legenda
**Quando** seleciono "economize 30%" e clico em "Sugerir alteração"
**Então** abre pop-up com texto original + campo para nova sugestão
**E** digito "poupe 30%"
**E** ao salvar, sugestão fica marcada em amarelo na legenda original.

### Cenário 2: Copywriter vê diff lado-a-lado
**Dado** que o copywriter abre o post
**Quando** há sugestões pendentes
**Então** painel lateral lista cada sugestão com "original → sugestão"
**E** botões "Aceitar" / "Rejeitar" por sugestão
**E** aceitar substitui automaticamente no texto.

### Cenário 3: Múltiplas sugestões simultâneas
**Dado** que aprovador deixou 4 sugestões em 1 legenda
**Quando** copywriter aceita 2 e rejeita 2
**Então** versão nova é criada com apenas as 2 aceitas
**E** notificação de volta ao aprovador com "2 de 4 sugestões aceitas".

### Cenário 4: Aprovador vê resposta
**Dado** que copywriter rejeitou uma sugestão
**Quando** aprovador reabre o post
**Então** vê badge amarelo "copywriter respondeu"
**E** comentário opcional do copywriter "tom da marca pede 'economize' por consistência"
**E** aprovador pode aceitar a resposta ou reafirmar sugestão.

### Cenário 5: Conflito entre sugestões
**Dado** que 2 aprovadores sugeriram textos diferentes para o mesmo trecho
**Quando** copywriter abre
**Então** pop-up mostra ambas sugestões + autor
**E** pede decisão (não aplica automaticamente).

## Dependências
- Backend: tabela `caption_suggestions` (id, post_id, version_id, original_text, selection_start, selection_end, suggested_text, status, author, parent_id).
- Frontend: seleção de texto com menu contextual, diff lado-a-lado na visão do copy.
- Externas: biblioteca tipo `diff-match-patch` para lidar com offsets.

## Fora de escopo
- Comentários sem sugestão explícita (usar pins de imagem ou thread geral).

## Links
- [[../roles/aprovador]]
- [[US-029-versionamento-diff-copy]]
- [[US-053-comentario-pinado-coordenada]]
