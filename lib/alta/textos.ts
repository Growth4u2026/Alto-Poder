// Textos fixos da Alta (seção 8 da especificação).
// Estes são os PADRÕES. O admin pode sobrescrever qualquer um pela chave "textos" da tabela settings
// (ver textos-servidor.ts). Marcação: *negrito*, {nome} vira o nome da pessoa, linha em branco separa parágrafos.

export const TEXTOS_PADRAO = {
  boasVindas:
    "Oiê! Eu sou a *Alta* 💜\n" +
    "Pensa em mim como aquela amiga que entende de negócio e tá sempre por perto.\n" +
    "Você me conta os pontos marcantes da semana no seu negócio e eu te devolvo o conteúdo prontinho. E pode me chamar pra tirar qualquer dúvida do seu negócio, tá?\n\n" +
    "Antes, deixa eu te conhecer melhor. Vou guardar algumas informações sobre o seu negócio só pra te ajudar do jeito certo. Posso? Me responde *SIM*.",

  cadastroNome: "Como você gosta que eu te chame?",
  cadastroNegocio: "Me conta: o que você vende? Pode ser numa frase só.",
  cadastroCliente: "E quem é a sua cliente dos sonhos?",
  cadastroOferta: "Qual produto ou serviço você mais quer vender agora?",
  cadastroTom: "Último: como você fala com as suas clientes? Mais leve e divertida, acolhedora ou mais séria?",
  cadastroFechamento: "Pronto, {nome}! Agora sim a gente se conhece 🥰 Bora descobrir onde o seu negócio trava?",

  gargaloIntroPlacar:
    "Primeiro, me conta o seu ponto de partida. São 5 perguntinhas rápidas. Se não souber algum número, tudo bem, é só tocar em *Não sei*.",
  placarFaturamento: "Quanto você fatura por mês, em média?",
  placarLucro: "Quanto você estima que sobra de lucro por mês?",
  placarTicket: "Qual é o seu ticket médio?",
  placarHoras: "Quantas horas por semana você trabalha no negócio?",
  placarObjetivo: "Se em 6 meses uma coisa mudasse no seu negócio, qual seria?",
  gargaloIntroAfirmacoes:
    "Agora vou te mostrar 18 frases. Pra cada uma, me dá uma nota de *0 a 10*:\n" +
    "*0* = não é a minha realidade · *10* = é exatamente assim.\n" +
    "Sem pensar muito, tá? A primeira resposta costuma ser a mais sincera.",
  gargaloFrase: "Agora você sabe onde o seu negócio trava. A gente vai destravar juntos.",

  menuBoasVindas:
    "Deixa eu te mostrar como eu posso te ajudar:\n\n" +
    "*1 · Conteúdo da semana*\n" +
    "Me conta os pontos marcantes da semana no seu negócio: uma cliente que te marcou, uma dúvida que te fizeram, uma venda, um resultado. Eu te devolvo Reels, carrossel, stories e legenda prontinhos, do seu jeito de falar.\n" +
    "👉 *Você ganha horas e para de postar no improviso.*\n\n" +
    "*2 · Ideia rápida*\n" +
    "Pra aquele dia em que você quer postar e não sabe o quê. Te mando 3 ideias com a frase de abertura pronta, pra gravar na hora.\n" +
    "👉 *Acabou o \"não sei o que postar\".*\n\n" +
    "*3 · Me tira uma dúvida*\n" +
    "Preço, cliente que sumiu, se vale fazer promoção, como responder um \"vou pensar\"… Me pergunta qualquer coisa do seu negócio, a qualquer hora.\n" +
    "👉 *Você decide com mais segurança, sem ficar na dúvida sozinha.*\n\n" +
    "*4 · Meu perfil*\n" +
    "Aqui ficam as informações do seu negócio, o seu Mapa do Gargalo e a sua concorrência. Mudou alguma coisa? Me avisa por aqui que eu ajusto tudo.\n" +
    "👉 *Assim eu te ajudo sempre do jeito certo.*\n\n" +
    "E aí, {nome}, o que vamos fazer hoje? Pode digitar o número ou mandar áudio 💜",
  menuCurto: "E aí, {nome}, o que vamos fazer hoje?",

  avisoLimiteSemanal:
    "Amiga, seus pedidos da semana acabaram! Segunda tem mais. Enquanto isso, que tal postar aquele conteúdo que a gente fez? Tá lindo demais pra ficar parado 😉",
  avisoMentoria:
    "Ah, essa parte eu faço com quem está na mentoria Growth4u! Se quiser saber como funciona, me responde MENTORIA que o time te chama.",
  avisoTetoDiario: "Hoje a gente trabalhou muito, hein, {nome}! Amanhã eu volto com tudo 💪",
  avisoErro: "Deu uma travadinha aqui. Tenta de novo daqui a pouco?",
  avisoForaDaLista:
    "Oi! Esse acesso é exclusivo para alunos da Growth4u e participantes do ALTO PODER. Se você já é, fala com o time da Growth4u.",
};

export type Textos = typeof TEXTOS_PADRAO;
export type ChaveTexto = keyof Textos;

export const OPCOES_TOM = ["Leve e divertida", "Acolhedora", "Mais séria e técnica"] as const;

/** Troca {nome} e outras variáveis. */
export function preencher(texto: string, vars: Record<string, string>) {
  return texto.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}
