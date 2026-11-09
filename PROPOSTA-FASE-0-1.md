# Alta · Proposta para Fase 0 e Fase 1

> Documento para aprovação. Nenhum código foi escrito ainda.

---

## 1. Estrutura de pastas

```text
alta/
├─ CLAUDE.md
├─ alta-especificacao-claude-code.md
├─ .env.example                 ← lista das variáveis (sem valores)
├─ app/                         ← telas e rotas (Next.js App Router)
│  ├─ (publico)/
│  │  ├─ entrar/                ← login por código
│  │  └─ privacidade/           ← política de privacidade
│  ├─ (aluno)/
│  │  ├─ inicio/                ← conversa com a Alta + menu
│  │  ├─ conteudo/              ← F1 Conteúdo da semana
│  │  ├─ ideia/                 ← F2 Ideia rápida
│  │  ├─ duvida/                ← F3 Dúvida de negócio
│  │  └─ perfil/                ← F4 Meu perfil + Mapa do Gargalo
│  ├─ admin/                    ← F8 painel da Laís
│  └─ api/
│     ├─ chat/                  ← chamadas ao Claude com streaming
│     ├─ cron/                  ← tarefas agendadas (reset de contadores etc.)
│     └─ whatsapp/              ← (Fase 4) webhook
├─ lib/
│  ├─ alta/                     ← o CÉREBRO, compartilhado por web e WhatsApp
│  │  ├─ prompt-sistema.ts      ← modelo da seção 7
│  │  ├─ funcoes/               ← conteudo.ts, ideia.ts, duvida.ts, gargalo.ts
│  │  ├─ textos.ts              ← leitura dos textos fixos da tabela settings
│  │  └─ limites.ts             ← checagem de uso por plano
│  ├─ canais/                   ← formatação web vs. WhatsApp
│  ├─ supabase/                 ← clientes do banco (navegador e servidor)
│  └─ claude.ts                 ← cliente da API Anthropic + prompt caching
├─ components/                  ← botões, blocos com "Copiar", barras do gargalo
├─ supabase/
│  ├─ migrations/               ← criação das tabelas (seção 12)
│  └─ seed.sql                  ← limites padrão, textos fixos, alunos de teste
├─ public/                      ← ícones e manifest do PWA
└─ tests/                       ← testes automáticos
```

O ponto principal: **todo o comportamento da Alta fica em `lib/alta/`**. A web hoje e o WhatsApp na Fase 4 só chamam esse mesmo cérebro.

---

## 2. Stack: confirmações e ajustes

Mantenho a sugestão da seção 11, com 4 ajustes:

| Item | Especificação | Proposta | Por quê |
| --- | --- | --- | --- |
| Front e back | Next.js + TypeScript, PWA | **Mantido** | Um projeto só, funciona bem no celular. |
| Banco e login | Supabase | **Mantido** | Banco, login por código, arquivos e pgvector num lugar só. |
| Login por WhatsApp | E-mail **ou** WhatsApp + código | **Fase 1: só e-mail.** WhatsApp entra na Fase 4 | Mandar código por WhatsApp exige o número da Meta já aprovado (ou um serviço pago tipo Twilio). O Supabase já manda código por e-mail sem custo extra. |
| Embeddings da base | Não especificado | **Voyage AI** (Fase 2) | A API do Claude não gera embeddings. A Voyage é a opção que a Anthropic recomenda e tem cota grátis inicial. Só entra na Fase 2. |
| Hospedagem | Vercel ou Cloudflare | **Vercel** | Melhor encaixe com Next.js e streaming. Plano grátis serve para começar. |
| Tarefas agendadas | Cron da hospedagem ou Supabase | **pg_cron do Supabase** chamando rotas `/api/cron` | O cron grátis da Vercel é limitado. O do Supabase não tem esse limite e já está no plano. |
| Limite de requisições | Por usuário e IP | **No próprio banco** | Evita contratar mais um serviço. |
| Envio de e-mail | — | **Resend** (grátis até 3 mil/mês) | O e-mail padrão do Supabase tem limite baixo de envios por hora; para 70 alunos precisa de um próprio. Pode ficar para o fim da Fase 1. |

Modelos de IA: **Haiku 5.5** para cadastro, menu e classificações; **Sonnet 5.5** para conteúdo, ideias, dúvidas e resultado do gargalo. Prompt caching na parte fixa do prompt de sistema.

---

## 3. O que você precisa criar (passo a passo)

### 3.1 No seu computador (grátis)
Hoje **não estão instalados** Node.js nem Git. Eu preciso deles para construir e testar.

1. **Node.js**: baixe em https://nodejs.org (botão "LTS") e instale clicando em "Avançar" até o fim.
2. **Git**: baixe em https://git-scm.com/download/win e instale com as opções padrão.
3. Feche e abra o Claude de novo para ele enxergar as instalações.

### 3.2 Contas (todas com plano grátis para começar)
| # | Conta | Para quê | Custo |
| --- | --- | --- | --- |
| 1 | **GitHub** (github.com) | Guardar o código e ligar na Vercel | Grátis |
| 2 | **Supabase** (supabase.com) | Banco, login, arquivos | Grátis no início |
| 3 | **Vercel** (vercel.com), entrar com o GitHub | Colocar o app no ar | Grátis no início |
| 4 | **Resend** (resend.com) | Mandar o código de login por e-mail | Grátis até 3 mil e-mails/mês |
| 5 | **Anthropic Console** (console.anthropic.com) · **só depois** | Chave da API do Claude para a Alta responder de verdade | Pago por uso, separado da assinatura do Claude |

**Modo simulado (decisão: começar só com meios gratuitos):** o app é construído com `ALTA_MODO_IA=simulado`. A Alta responde com textos de exemplo, e tudo funciona: login, cadastro, gargalo, menus, limites e admin. A conta 5 só é necessária quando você decidir ligar as respostas reais, trocando para `ALTA_MODO_IA=real`.

### 3.3 Chaves que você vai preencher no `.env` (Fase 0 e 1)
Eu crio o arquivo `.env.example` com os nomes. Você copia para `.env.local` e cola os valores. **Nunca mande as chaves no chat.**

| Variável | Onde encontrar |
| --- | --- |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Mesma tela → chave "anon / public" |
| `SUPABASE_SERVICE_ROLE_KEY` | Mesma tela → chave "service_role" (secreta) |
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys → Create Key |
| `RESEND_API_KEY` | Resend → API Keys |
| `APP_URL` | `https://alta.growth4u.com.br` |
| `ADMIN_EMAILS` | Seu e-mail e o do time, separados por vírgula |
| `TZ` | `America/Sao_Paulo` |

As do Google Drive, Voyage, transcrição e WhatsApp ficam para as Fases 2 e 4.

### 3.4 Domínio (Wix)
No fim da Fase 0, eu te passo o valor exato do **CNAME** `alta` → Vercel para você colar no DNS do Wix.

---

## 4. Plano de tarefas

### Fase 0 · Preparação
| # | Tarefa | Aceite |
| --- | --- | --- |
| 0.1 | Criar o projeto Next.js + PWA, `.env.example`, repositório no GitHub | Abre no navegador do computador |
| 0.2 | Ligar Supabase e criar as tabelas da seção 12 (só as usadas na Fase 1) | Tabelas visíveis no painel do Supabase |
| 0.3 | Login por código de 6 dígitos no e-mail, só para quem está na lista de acesso | E-mail de teste recebe código e entra; e-mail fora da lista vê o aviso 8.5 |
| 0.4 | Publicar na Vercel e ligar `alta.growth4u.com.br` | **App abre no celular no endereço final com login funcionando** |

### Fase 1 · MVP web
| # | Tarefa | Aceite |
| --- | --- | --- |
| 1.1 | Tabela `settings` com limites por plano e textos fixos (seção 8), editáveis | Mudar um limite no banco muda o comportamento sem mexer em código |
| 1.2 | Boas-vindas + consentimento LGPD + página de privacidade | Sem "SIM", nada é salvo; data e hora do consentimento registradas |
| 1.3 | Cadastro, uma pergunta por vez | As 5 respostas aparecem no perfil |
| 1.4 | Mapa do Gargalo: placar inicial + 18 afirmações + cálculo + mensagem do resultado | Notas por pilar corretas, desempate pela ordem 1→6 (com teste automático) |
| 1.5 | Menu de boas-vindas (só 1º acesso) e menu curto | Primeiro acesso vê o longo; depois só o curto |
| 1.6 | Montagem do prompt de sistema (seção 7) com prompt caching | Dados do aluno aparecem nas respostas; registro de tokens em `messages` |
| 1.7 | F1 Conteúdo da semana, com streaming e botão "Copiar" por bloco | **Sai em menos de 60 segundos**, nas 4 partes, na ordem certa |
| 1.8 | F2 Ideia rápida | 3 ideias com formato, gancho, o que mostrar e CTA |
| 1.9 | F3 Dúvida de negócio com memória (10 trocas + resumo) | Lembra o que foi dito antes; resposta em até 6 linhas |
| 1.10 | F4 Meu perfil: editar dados, ver e refazer o gargalo (com histórico) | Edição salva; diagnóstico antigo continua no histórico |
| 1.11 | Limites por plano, reset segunda 00h e dia 1, avisos 8.5, registro de "MENTORIA" | `alto_poder` bloqueia no 2º conteúdo da semana; `start` bloqueia no teto diário |
| 1.12 | Painel admin básico: lista de acesso (CSV e manual), alunos, gargalos, mapa da turma | Só e-mails em `ADMIN_EMAILS` entram; mapa da turma mostra contagem por pilar |
| 1.13 | Teste final com 5 alunos de teste | **5 alunos completam cadastro e diagnóstico e aparecem no mapa da turma** |

Cada tarefa termina com testes automáticos e um passo a passo de como conferir no celular.

---

## 5. Decisões que preciso de você agora

1. **Aprova os ajustes da seção 2?** Principalmente login só por e-mail na Fase 1, Vercel e Resend.
2. **Pode criar a conta paga da Anthropic** (com quanto de crédito inicial)?
3. **Contato do aviso "fora da lista"**: qual WhatsApp da Growth4u eu coloco?
