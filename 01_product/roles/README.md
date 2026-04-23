---
created: 2026-04-15
updated: 2026-04-15
owner: coordinator
status: active
confidence: high
---

# Roles de usuário (painéis personalizados)

> O crie-web é consumido por **6 personas dentro de uma agência de marketing**. Cada persona tem um painel especializado para reduzir o atrito na produção de conteúdo **Instagram-nativo**.

## Formatos Instagram suportados (baseline do produto)
| Formato | Dimensão | Ratio | Notas |
|---|---|---|---|
| Story / Reel | 1080×1920 | 9:16 | Safe zone: top 250px (profile) + bottom 350px (CTA/captions) |
| Feed quadrado | 1080×1080 | 1:1 | Default histórico |
| Feed retrato | 1080×1350 | 4:5 | Máximo aproveitamento de tela no feed |
| Feed paisagem | 1080×566 | 1.91:1 | Menos usado, link preview |
| Carrossel | 1080×1080 ou 1080×1350 | 1:1 ou 4:5 | Até 10 slides, mesmo ratio entre slides |
| Single image | qualquer do feed | — | — |
| Reel vídeo | 1080×1920 | 9:16 | MP4 H.264, até 90s para feed, ratio trimado no topo |

## As 6 roles
| Role | Arquivo | Jobs principais |
|---|---|---|
| Estrategista | [[estrategista]] | Calendário, pilares, briefs, campanhas, performance |
| Copywriter | [[copywriter]] | Legendas, roteiros de Reel/Stories, hooks, CTAs |
| Designer | [[designer]] | Artes multiformato, brand kit, carrosséis, grid |
| Social Media / Publisher | [[social-media]] | Agendamento, publicação, grid planner, Meta API |
| Aprovador (cliente) | [[aprovador]] | Revisar, comentar, aprovar, mockup IG |
| Admin da agência | [[admin]] | Marcas, time, permissões, billing, white-label |

## Handoff canônico de um post
```
Estrategista → brief
   ↓
Copywriter ⟷ Designer  (trabalham em paralelo com o brief)
   ↓
[interno: revisão cruzada]
   ↓
Aprovador (cliente)  →  aprovado / pedido de ajuste
   ↓
Social Media → agenda e publica via Meta Graph API
   ↓
Estrategista → performance
```

## Links
- [[../ideia]] — o que é o produto
- [[../roadmap]] — quando cada painel entra
- [[../user-stories/index]] — stories por role
- [[../../04_frontend/screens/README|screens]] — wireframes dos painéis
