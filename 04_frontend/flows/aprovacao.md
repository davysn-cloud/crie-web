---
created: 2026-04-15
updated: 2026-04-15
owner: Frontend Agent
status: draft
confidence: medium
---

# Fluxo — Aprovação de Post

## Atores
Criador (agência) ↔ Cliente (marca).

## Passos
1. Criador cria card em `Ideação`.
2. Criador move para `Em criação` e anexa mídia.
3. Criador move para `Aprovação` → dispara notificação ao cliente.
4. Cliente entra via link/convite, vê o card em modo "revisor".
5. Cliente **aprova** ou **pede ajuste** (comentário obrigatório).
6. Se aprovado → card vai para `Agendado` (data/hora).
7. Cron/worker move para `Publicado` na data (ou manual no MVP).

## Regras
- Apenas `approver` do `client` pode aprovar.
- Aprovação registra `approvals` (auditoria).
- Comentário de "pedir ajuste" é obrigatório.

## Links
- [[01_product/user-stories/index]] — US-09, US-10, US-11
- [[03_backend/schema]]
