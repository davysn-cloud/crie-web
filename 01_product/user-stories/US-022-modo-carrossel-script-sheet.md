---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: copywriter
feature_ref: F2 de [[../roles/copywriter]]
priority: P0
effort: M
---

# US-022 — Modo carrossel (script sheet por slide)

## Como / Quero / Para que
**Como** copywriter,
**quero** escrever o roteiro de um carrossel em um grid de até 10 slides com campos por slide (título, copy, CTA visual),
**para que** o designer receba texto estruturado por slide em vez de um bloco único.

## Contexto
Carrosséis são o formato de maior engajamento no feed. Sem estrutura por slide, copy e arte desalinham. O grid segue a estrutura recomendada: S1 hook, S2-9 desenvolvimento, S10 CTA + salvar.

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar carrossel com slides numerados
**Dado** que recebi um brief com formato "Carrossel 1080×1350"
**Quando** abro o script sheet
**Então** vejo um grid vertical de 10 slides com numeração 1 a 10
**E** Slide 1 tem label "Capa / Hook"
**E** Slide 10 tem label "CTA / Salve esse post"
**E** slides 2-9 têm label "Desenvolvimento".

### Cenário 2: Campos por slide
**Dado** que estou editando o slide 3
**Quando** preencho "Título" (max 40 chars), "Copy corpo" (max 180 chars) e "CTA visual do slide" (ex: seta, próxima página, swipe)
**Então** os campos auto-salvam após 2s de idle
**E** o contador de cada campo fica visível abaixo dele.

### Cenário 3: Remover slides acima de 2
**Dado** que o carrossel tem 10 slides mas vou usar só 6
**Quando** clico no menu "..." dos slides 7, 8, 9 e 10 e escolho "Remover"
**Então** os 4 slides são removidos
**E** o carrossel fica com 6 slides
**E** o sistema valida: mínimo 2 slides (IG exige ≥2 pro carrossel).

### Cenário 4: Validação do mínimo
**Dado** que tento remover o slide 2 com apenas 2 slides existentes
**Quando** clico "Remover"
**Então** o sistema bloqueia
**E** mostra "Carrossel precisa de no mínimo 2 slides (Instagram)".

### Cenário 5: Exportar script para o designer
**Dado** que preenchi os 6 slides
**Quando** clico em "Enviar para designer"
**Então** o designer recebe notificação
**E** no painel do designer ([[US-034-carousel-builder-dnd]]) cada slide já vem pré-preenchido com título + copy
**E** o copywriter trava edição (status `sent_to_design`) e só reabre via "Solicitar alteração".

### Cenário 6: Reordenar slides via drag-drop
**Dado** que tenho 8 slides preenchidos
**Quando** arrasto o slide 5 para a posição 3
**Então** a numeração recalcula (o slide 5 vira 3, os 3-4 anteriores descem)
**E** o label "Hook" sempre fica no primeiro e "CTA" sempre no último slide.

## Dependências
- Backend: tabela `carousel_slides` (id, post_id, slide_index, title, body, visual_cta).
- Frontend: dnd-kit para reordenação, RHF por slide, autosave.
- Externas: none.

## Fora de escopo
- Geração IA do script completo (usar [[US-028-brand-voice-ia]] para sugestões).
- Animação de transição entre slides.

## Links
- [[../roles/copywriter]]
- [[US-034-carousel-builder-dnd]]
- [[US-028-brand-voice-ia]]
