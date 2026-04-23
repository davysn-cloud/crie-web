---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: copywriter
feature_ref: F3 de [[../roles/copywriter]]
priority: P1
effort: M
---

# US-023 — Template de roteiro Reel com timestamps

## Como / Quero / Para que
**Como** copywriter,
**quero** estruturar um Reel em 3 blocos temporais (Hook 0-3s, Desenvolvimento 3-X, CTA final) com overlay, áudio e direção por bloco,
**para que** o time consiga produzir Reels de até 90s sem refazer estrutura a cada vez.

## Contexto
Reel é o formato de crescimento de 2024-2026. Hook é tudo. Overlay de texto precisa ter no máximo ~25 chars/linha para legibilidade no mobile.

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar Reel com 3 blocos padrão
**Dado** que o brief pede formato "Reel 9:16"
**Quando** abro o template de roteiro
**Então** vejo 3 blocos fixos: "Hook (0-3s)", "Desenvolvimento (3-X)", "CTA (final)"
**E** cada bloco tem campos: texto em tela (overlay), áudio sugerido (URL ou texto), direção de câmera.

### Cenário 2: Contador de caracteres por linha do overlay
**Dado** que estou no campo overlay do Hook
**Quando** digito "Você sabia que dá pra economizar 30%?"
**Então** o contador mostra "38 chars — quebra em 2 linhas no mobile"
**E** aviso: "linhas ideais: ≤25 chars para legibilidade".

### Cenário 3: Duração configurável
**Dado** que o Reel vai ter 30s totais
**Quando** ajusto o slider "duração total"
**Então** o bloco Desenvolvimento atualiza o label para "3-27s"
**E** o bloco CTA fica "27-30s".

### Cenário 4: Limite de 90s feed Reel
**Dado** que ajusto a duração para 120s
**Quando** tento salvar
**Então** o sistema bloqueia
**E** aviso "Reels no feed têm limite de 90s (Instagram)".

### Cenário 5: Áudio como link externo
**Dado** que o estrategista enviou um trending sound
**Quando** colo a URL do som do IG/TikTok no campo "áudio sugerido"
**Então** o sistema detecta o domínio válido
**E** mostra preview do nome do som (se acessível) + link clicável
**E** caso não acessível, armazena só o texto.

### Cenário 6: Exportar roteiro para o designer
**Dado** que preenchi os 3 blocos
**Quando** clico "Enviar para designer" ou "Enviar para editor de vídeo"
**Então** o roteiro é impresso em 1 PDF + JSON estruturado
**E** linkado ao post com status `ready_for_design`.

## Dependências
- Backend: tabela `reel_scripts` (id, post_id, duration_seconds, blocks_json).
- Frontend: form estruturado, slider de duração, contador mobile-like.
- Externas: none (trending sounds são manuais no MVP — ver [[US-029-trending-sounds-reel]]).

## Fora de escopo
- Edição de vídeo dentro da plataforma (fase 3+).
- Biblioteca de trending sounds automática (ver [[US-029-trending-sounds-reel]] para fase 2).

## Links
- [[../roles/copywriter]]
- [[US-024-script-stories-frames]]
- [[US-029-trending-sounds-reel]]
