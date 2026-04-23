---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: medium
---

# ADR 005 — Versionamento de posts (snapshot completo vs diff)

## Contexto
Copy (F9/F10) e Designer (F10) precisam histórico de versões de um post com diff visual. Também suportamos "congelar" a versão aprovada pelo cliente.

Atualmente o banco tem:
- `copy_versions` — versão de texto individual (body/caption/hashtags) por card.
- `asset_versions` — versão de arte individual (file_url) por card.

Isto não carrega o **estado composto** do post naquele momento (copy + arte + hashtags + brief). Precisamos de algo no nível do card.

Opções:
1. **Snapshot completo em JSONB** (`post_versions.payload_json`).
2. **Diff (patch) entre versões**.
3. **Referências (FK arrays) para copy_version/asset_version daquele momento**.

## Opções avaliadas

### A) Snapshot completo em JSONB
Prós:
- Simples de ler e renderizar ("mostre v3" = pega payload_json).
- Imutável por natureza.
- Resiste a mudanças de schema (se um campo some, ainda temos o snapshot).
- Aprovação congela = apenas marcar `is_locked=true`.

Contras:
- Duplicação de dados (copy já está em `copy_versions`).
- Crescimento ao longo do tempo.

### B) Diff/patch
Prós:
- Espaço eficiente.

Contras:
- Muito mais código: montar versão N = aplicar diffs 1..N.
- Diff binário de arte é impraticável.
- Risco de corrupção (diff quebrado).

### C) Referências
Prós:
- Zero duplicação.

Contras:
- Se alguém deleta uma `copy_version` referenciada, a `post_version` quebra.
- Requer CASCADE RESTRICT + orquestração cuidadosa.
- Congelamento depende de múltiplas tabelas — mais superfície de bug.

## Decisão

**Opção A: snapshot completo em JSONB** (`post_versions.payload_json`).

Formato do payload:
```json
{
  "copy": {
    "body": "...",
    "caption": "...",
    "hashtags": ["tag1", "tag2"],
    "first_comment": "..."
  },
  "brief": { "id": "...", "objective": "conversion", "key_message": "..." },
  "pillar_id": "...",
  "campaign_id": "...",
  "formats": [
    { "ig_format": "feed_4_5", "asset_version_id": "...", "storage_path": "...", "width": 1080, "height": 1350 },
    { "ig_format": "story", "asset_version_id": "...", ... }
  ],
  "carousel_slides": [ { "index": 0, "title": "...", "body": "...", "asset_version_id": "..." }, ... ],
  "created_by_snapshot": { "user_id": "...", "display_name": "..." }
}
```

Campo `version` incrementa por card (UNIQUE `(post_card_id, version)`).

Diff é **computado na UI**, não persistido — comparar `payload_json` de v[n-1] e v[n] com lib tipo `jsondiffpatch`.

## Consequências
- Uma `post_version` pode ficar grande (payload com 10 URLs + copy + campos). Aceitável: estimativa < 20KB por versão. Postgres TOAST automático lida bem.
- Ao editar um post, criar nova `post_version` é explícito — **não** faz automaticamente a cada save. Otimização: só criar em "pontos de corte" (enviar para aprovação, receber ajuste, aprovado).
- `copy_versions` e `asset_versions` continuam existindo para granularidade fina (ex: "quem mudou exatamente este caption?").
- `is_locked = true` + `locked_by` + `locked_at` congela versão. Edição cria nova.
- DELETE proibido (sem policy) — histórico é imutável.

## Consequências para storage
- Assets são referenciados por `storage_path`. Se alguém deletar o asset do Storage, o `payload_json` fica com URL quebrado. Mitigação: Edge Function "GC de storage" nunca deleta assets referenciados em qualquer `post_versions.payload_json` — roda lookup GIN jsonb.
- **Pendência:** implementar esse GC como safeguard.

## Links
- [[../../03_backend/schema#post_versions]]
- [[../../01_product/roles/copywriter#F9]]
- [[../../01_product/roles/designer#F10]]
