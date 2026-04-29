---
created: 2026-04-29
updated: 2026-04-29
owner: prospector
status: active
confidence: high
---

# Processo de Scan de Agencias no Instagram

**Objetivo:** Executar um ciclo completo de prospeccao manual via Instagram — desde a busca por hashtags ate o registro do lead qualificado — de forma rapida, reproducivel e sem violar os Termos de Uso da plataforma.
**Referencias:** [[fontes-pesquisa]], [[qualificacao-checklist]], [[../../01_product/icp]]

---

## Principios do processo

1. **Manual, sem bots.** Nenhum scraper, extensao de automacao ou ferramenta de terceiros que acesse a API privada do Instagram. Apenas navegacao humana na interface web ou app.
2. **Volume controlado.** Meta de 10-20 perfis analisados por sessao (45-60 min). Qualidade > quantidade.
3. **Registro imediato.** Cada perfil avaliado entra no registro — mesmo os descartados — para evitar retrabalho.
4. **Personalizacao real.** O gancho de abordagem deve citar algo especifico do perfil visto no scan. Nao enviar template generico.

---

## Materiais necessarios antes de comecar

- [ ] Planilha de leads aberta (Google Sheets ou Notion — ver template em [[qualificacao-checklist]])
- [ ] Checklist de qualificacao em mao ([[qualificacao-checklist]])
- [ ] Criterios de exclusao memorizados (ou abertos em aba paralela)
- [ ] Sessao do Instagram logada no browser ou app
- [ ] Bloco de notas para rascunhos rapidos de gancho

---

## Etapa 1 — Escolha da hashtag de entrada

### Hashtags primarias (maior volume, mais ruido)

| Hashtag | Perfil tipico do resultado |
|---|---|
| `#agenciadigital` | Misto: agencias, freelancers, cursos |
| `#agenciademarketingdigital` | Mais focado em agencias reais |
| `#agenciadesocialmedia` | Proximo do ICP — gestoras de redes |
| `#gestaoderedes` | Proxximo do ICP — gestao de social media |
| `#conteudodigital` | Misto: agencias + criadores individuais |

### Hashtags secundarias (menor volume, mais qualidade)

| Hashtag | Por que usar |
|---|---|
| `#vidadeagencia` | Posts de bastidores — alta chance de ver dores reais |
| `#rotinadeagencia` | Idem — equipes mostrando processo caótico |
| `#marketingdeconteudo` | Agencias focadas em conteudo organico |
| `#agenciacriativa` | Agencias com foco em producao visual |
| `#socialmediabrasil` | Social media managers — podem ser de agencias |
| `#gestorderedessociais` | Similar — buscar quem postou em nome de agencia |

### Estrategia de rotacao

- Comece por uma hashtag secundaria (menor ruido).
- Alterne entre primarias e secundarias a cada sessao.
- Registre qual hashtag usou na sessao para nao repetir na proxima.

---

## Etapa 2 — Navegacao no feed de hashtag

### Onde olhar

1. **Aba "Recentes"** (nao "Em alta") — mostra conteudo atual, agencias ativas.
2. Ignorar posts com menos de ~50 curtidas (pode indicar perfil muito pequeno ou inativo).
3. Ignorar posts claramente de pessoas fisicas (selfie, lifestyle sem contexto de agencia).

### O que clicar

- Posts que mostram: feed de cliente, grade de stories, mockup de publicacao, bastidores de equipe, resultado de campanha, print de aprovacao caótica.
- Bio do perfil que posta: verificar se e pessoa juridica ou agencia com equipe.

### Tempo por post

- 10-15 segundos para decidir se clica no perfil.
- Se nao ficou claro em 15 segundos, pula.

---

## Etapa 3 — Avaliacao do perfil (2-3 minutos por agencia)

### Checklist rapido de primeira impressao (30 segundos)

- [ ] E uma agencia (nao freelancer solo, nao influencer, nao marca)?
- [ ] Tem pelo menos 1 ano de existencia no perfil (ver data do primeiro post)?
- [ ] Bio menciona servicos de social media, gestao de redes ou conteudo?
- [ ] Tem pelo menos 500 seguidores (proxy minimo de relevancia)?

Se qualquer um for NAO → **descartar imediatamente**. Nao pontuar. Passar para o proximo.

---

### Leitura da bio (30 segundos)

Extrair e registrar em rascunho:

- **@handle**
- **Nome da agencia**
- **Servicos mencionados** (social media, conteudo, trafego, branding?)
- **Numero de clientes** (se bio mencionar "+X clientes atendidos" ou "atendemos marcas como")
- **Link da bio** (site? Linktree? WhatsApp direto?)
- **Cidade/estado** (se mencionar)

**Sinais de fit na bio:**
- "Gestao de redes sociais para marcas" → +fit
- "Aprovamos seu conteudo" → raro, mas +fit maximo
- "Performance / trafego pago / meta ads" como unico servico → cuidado (pode ser Anti-ICP)
- "Freelancer / autonoma" → descarte imediato

---

### Analise do feed (1 minuto)

Rolar os ultimos 9-12 posts. Observar:

| Sinal | O que indica |
|---|---|
| Feed de clientes variados (marcas diferentes) | 5+ clientes ativos — +3 pontos |
| Post sobre "rotina de agencia", "bastidores", "aprovacao" | Dor visivel — +2 pontos |
| Post sobre "organizacao", "produtividade", "processo" | Alta receptividade a solucao |
| Feed so de conteudo proprio da agencia (sem clientes) | Pode ser agencia nova ou portfolio |
| So posts de trafego pago / performance | Anti-ICP — considerar descarte |
| Posts com Reels ou Stories criativos de marcas | Designer no time — equipe estruturada |
| Carrossel de resultados ("entregamos X posts este mes") | Indicio de volume alto de producao |

---

### Verificacao de tamanho de equipe (30 segundos)

- Bio menciona cargos separados (social media, designer, estrategista)? → equipe estruturada
- Posts marcam colegas de equipe? → time real
- Menciona "nosso time", "nossa equipe"? → nao e solo
- Nenhum indicio de equipe + bio em primeira pessoa? → provavelmente freelancer — descartar

---

### Verificacao do site (opcional, 30 segundos)

- Clicar no link da bio.
- Verificar rapidamente: lista de servicos, "equipe" ou "sobre nos", depoimentos de clientes.
- Menciona ferramenta de aprovacao (Planable, Gain, ContentCal)? → **descarte imediato**.
- Site profissional com portfolio? → sinal positivo de maturidade.

---

## Etapa 4 — Pontuacao ICP

Preencher o scoring do [[qualificacao-checklist]] com o que foi coletado:

| # | Criterio | Pontos possiveis | Evidencia coletada |
|---|---|---|---|
| 1 | 5+ clientes de social media | +3 | Feed com marcas variadas / bio |
| 2 | Aprova via WhatsApp/email | +3 | Post sobre aprovacao caótica / inferencia |
| 3 | Time com 3+ pessoas | +2 | Bio com cargos / posts marcando colegas |
| 4 | Nao usa ferramenta dedicada | +2 | Site nao menciona / ausencia de sinal |
| 5 | Faz social media como core | +2 | Bio + feed de clientes |
| 6 | Postou sobre processo/organizacao | +2 | Post especifico identificado |
| 7 | Ja tentou Trello/Notion | +1 | Post ou inferencia |
| 8 | Agencia com 1+ ano de mercado | +1 | Data do primeiro post / site |

**Score < 8:** adicionar a lista de nurturing (coluna "Cool"). Nao abordar agora.
**Score >= 8:** registrar como lead ativo. Ir para Etapa 5.

---

## Etapa 5 — Registro do lead

Usar o template de registro do [[qualificacao-checklist]]:

```markdown
### [Nome da Agencia]
- **Site:** [URL da bio ou descoberto no scan]
- **Instagram:** @[handle] ([X] seguidores)
- **Localizacao:** [cidade/estado, se visivel]
- **Tamanho:** ~[X] pessoas (inferido)
- **Clientes visiveis:** [X] marcas (feed)
- **Servicos:** [social media, conteudo, ads, etc.]
- **Fonte:** Instagram / hashtag #[hashtag usada]
- **Score ICP:** [X]/16
- **Decision maker:** [nome do perfil / dono aparente]
- **Contato:** [link da bio / email se visivel]
- **Gancho:** [post especifico, frase da bio, dor visivel]
- **Status:** pesquisado
```

### Onde salvar o gancho

O gancho e o item mais importante do registro. Exemplos de bons ganchos:

- "Postou em 2026-04-22 sobre aprovar conteudo por WhatsApp e perder mensagem do cliente — dor exatamente descrita."
- "Bio diz 'atendemos +12 marcas'. Feed mostra clientes variados mas nenhum post sobre processo."
- "Carrossel de 'rotina de segunda na agencia' mostrando planilha de controle manual de posts."
- "Story de bastidor com Trello aberto com dezenas de colunas — caos visivel."

---

## Etapa 6 — Identificacao do decision maker

Para agencias menores (< 15 pessoas), o decision maker geralmente e o dono/fundador.

**Como identificar:**

1. **Bio do perfil da agencia:** muitas vezes menciona "fundada por @[handle]" ou tem link para perfil pessoal do dono.
2. **Posts da agencia:** verificar quem assina os conteudos editoriais (artigo, opiniao, making-of).
3. **Perfil pessoal do dono:** buscar pelo nome. Ver se tem LinkedIn (para abordagem complementar).
4. **Comentarios:** quem responde comentarios de clientes no feed da agencia?

**Registrar:**
- Nome
- @handle pessoal (se diferente do da agencia)
- LinkedIn (se encontrado)
- Email (se visivel na bio ou site)

---

## Etapa 7 — Definicao do canal de abordagem

| Situacao | Canal recomendado | Template |
|---|---|---|
| Email visivel no site/bio | Email frio personalizado | [[templates/cold-outreach]] — variante email |
| Sem email, so DM disponivel | Instagram DM | [[templates/cold-outreach]] — variante DM |
| Decision maker tem LinkedIn ativo | LinkedIn InMail | [[templates/cold-outreach]] — variante LinkedIn |
| Conexao em comum (rede pessoal) | Indicacao direta | Abordagem livre, mais informal |

**Regra de ouro:** O canal so muda o tom e o tamanho. O gancho personalizado e obrigatorio em todos.

---

## Etapa 8 — Fechamento da sessao de scan

Ao fim de cada sessao (45-60 min), registrar no topo do arquivo de log da sessao:

```markdown
## Sessao [YYYY-MM-DD]
- **Hashtags usadas:** #[hashtag1], #[hashtag2]
- **Perfis analisados:** [X]
- **Descartados (criterio de exclusao):** [X]
- **Pontuados (score < 8):** [X] → nurturing
- **Leads ativos (score >= 8):** [X] → abordagem
- **Proxima hashtag sugerida:** #[hashtag]
- **Observacoes:** [qualquer padrao percebido, dificuldade, insight]
```

---

## Metricas de eficiencia do processo

| Metrica | Referencia saudavel |
|---|---|
| Tempo por perfil analisado | 2-4 minutos |
| Taxa de descarte por exclusao imediata | 50-70% (normal — muito ruido no feed) |
| Taxa de leads ativos (score >= 8) | 15-30% dos perfis que passaram da exclusao |
| Leads ativos por sessao de 1h | 3-8 leads qualificados |
| Ganchos sem personalizacao real | 0% — nenhum deve ser enviado sem gancho |

---

## Erros mais comuns (e como evitar)

| Erro | Consequencia | Como evitar |
|---|---|---|
| Analisar perfis sem verificar criterios de exclusao primeiro | Tempo perdido em Anti-ICPs | Sempre checar exclusao antes de pontuar |
| Registrar lead sem gancho especifico | Abordagem generica, baixa taxa de resposta | Nao fechar o registro sem preencher campo "Gancho" |
| Usar automacao ou bot de scraping | Banimento do Instagram + perda de credibilidade | Apenas navegacao humana — regra inegociavel |
| Enviar DM sem personalizar o template | Parece spam, queima o lead | Adaptar sempre para a realidade do perfil |
| Avaliar mesmo perfil em sessoes diferentes | Retrabalho e abordagem duplicada | Registrar TODOS os perfis analisados, inclusive descartados |
| Focar so em perfis grandes (10k+ seguidores) | ICP ideal tem 1k-10k — mais acessivel e mais qualificado | Priorizar engajamento sobre tamanho |

---

## Cadencia recomendada para o beta

| Semana | Meta de sessoes | Meta de leads ativos |
|---|---|---|
| Semana 1 | 3 sessoes (45 min cada) | 10-15 leads |
| Semana 2 | 3 sessoes | 10-15 leads |
| Semana 3 | 2 sessoes (foco em follow-up) | 5-8 leads novos |
| Semana 4 | 2 sessoes (foco em follow-up) | 5-8 leads novos |

**Objetivo do primeiro mes:** 30-45 leads qualificados. Desses, meta de 10-15 demos agendadas. Meta de conversao beta: 3-5 agencias piloto.

---

## Links

- [[fontes-pesquisa]]
- [[qualificacao-checklist]]
- [[templates/cold-outreach]]
- [[../../01_product/icp]]
- [[../../01_product/personas/dono-agencia]]
- [[../../01_product/gtm-beta]]
