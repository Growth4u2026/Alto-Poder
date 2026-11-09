// Explicação do gargalo em tom de amiga.
// Modo simulado (ALTA_MODO_IA=simulado): textos-modelo por pilar, sem custo.
// Modo real: o Claude gera a explicação com os mesmos dados (entra junto com o prompt de sistema, tarefa 1.6).

const EXPLICACAO: Record<number, string> = {
  1: "Hoje você ainda não enxerga direito os números e o seu tempo, e aí fica difícil saber o que dá lucro de verdade. A gente começa olhando pra isso com calma, sem planilha complicada.",
  2: "Ainda não tá claro pra todo mundo por que escolher você, e aí a conversa acaba indo pro preço. Vamos deixar bem nítido quem é a sua cliente e o que só você entrega.",
  3: "O seu preço e as suas ofertas ainda não trabalham a seu favor: dá pra ganhar mais sem trabalhar mais horas. O caminho passa por margem, ticket médio e recompra.",
  4: "Os clientes ainda chegam meio no improviso, sem previsibilidade. A gente vai fazer o seu conteúdo puxar conversa e venda, não só curtida.",
  5: "As pessoas chegam até você, mas parte delas escapa no meio do caminho. Com um atendimento e um follow-up simples, muita venda que hoje se perde vira fechamento.",
  6: "Hoje o negócio depende demais de você, e isso cansa. Vamos organizar rotina, processos e automações pra você parar de fazer tudo sozinha.",
};

export function explicarGargalo(gargalo: number, nome: string): string {
  return `${nome}, o seu gargalo principal é *${["", "Números & Tempo", "Cliente & Posicionamento", "Oferta & Preço", "Marketing & Demanda", "Vendas & Conversão", "Processos & Autonomia"][gargalo]}*.\n${EXPLICACAO[gargalo]}`;
}
