// Mapa do Gargalo (seção 9 da especificação). Arquivo puro: sem banco, sem IA, testável.

export const PILARES = [
  "Números & Tempo",
  "Cliente & Posicionamento",
  "Oferta & Preço",
  "Marketing & Demanda",
  "Vendas & Conversão",
  "Processos & Autonomia",
] as const;

/** 18 afirmações, 3 por pilar, na ordem da jornada (pilar 1 → 6). */
export const AFIRMACOES: { pilar: number; texto: string }[] = [
  { pilar: 1, texto: "Sei quanto lucrei no último mês" },
  { pilar: 1, texto: "Separo a conta da empresa da pessoal" },
  { pilar: 1, texto: "Tenho uma rotina semanal para olhar o negócio" },
  { pilar: 2, texto: "Sei exatamente quem é meu cliente ideal" },
  { pilar: 2, texto: "Meus clientes sabem por que me escolher" },
  { pilar: 2, texto: "Não sou escolhido(a) só pelo preço" },
  { pilar: 3, texto: "Meu preço é calculado com margem" },
  { pilar: 3, texto: "Sei qual produto ou serviço mais me dá lucro" },
  { pilar: 3, texto: "Tenho ofertas que aumentam o ticket ou geram recompra" },
  { pilar: 4, texto: "Recebo novos clientes todo mês com previsibilidade" },
  { pilar: 4, texto: "Meu conteúdo gera conversas e vendas" },
  { pilar: 4, texto: "Sei de onde vêm meus clientes" },
  { pilar: 5, texto: "Tenho um processo de atendimento e follow-up" },
  { pilar: 5, texto: "Sei quantos orçamentos viram venda" },
  { pilar: 5, texto: "Sei responder às objeções mais comuns" },
  { pilar: 6, texto: "O negócio funciona alguns dias sem mim" },
  { pilar: 6, texto: "Tenho tarefas organizadas, automatizadas ou delegadas" },
  { pilar: 6, texto: "Não faço tudo sozinho(a)" },
];

export type ResultadoGargalo = {
  /** Nota de cada pilar, chave "1" a "6", com uma casa decimal. */
  notasPorPilar: Record<string, number>;
  gargalo1: number;
  gargalo2: number;
};

/**
 * Recebe as 18 notas (0 a 10) na ordem de AFIRMACOES.
 * Nota do pilar = média das 3 afirmações. Gargalo principal = menor nota; secundário = segunda menor.
 * Empate: vence o pilar que vem antes (1 → 6).
 */
export function calcularGargalo(notas: number[]): ResultadoGargalo {
  if (notas.length !== AFIRMACOES.length) throw new Error(`Esperava ${AFIRMACOES.length} notas, recebi ${notas.length}`);
  notas.forEach((n, i) => {
    if (!Number.isInteger(n) || n < 0 || n > 10) throw new Error(`Nota inválida na afirmação ${i + 1}: ${n}`);
  });

  const notasPorPilar: Record<string, number> = {};
  for (let p = 1; p <= 6; p++) {
    const doPilar = notas.filter((_, i) => AFIRMACOES[i].pilar === p);
    const media = doPilar.reduce((a, b) => a + b, 0) / doPilar.length;
    notasPorPilar[String(p)] = Math.round(media * 10) / 10;
  }

  // sort é estável: em empate, mantém a ordem 1 → 6.
  const ordem = [1, 2, 3, 4, 5, 6].sort((a, b) => notasPorPilar[a] - notasPorPilar[b]);
  return { notasPorPilar, gargalo1: ordem[0], gargalo2: ordem[1] };
}
