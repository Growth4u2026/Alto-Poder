"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import TextoAlta from "@/components/TextoAlta";
import { AFIRMACOES, PILARES } from "@/lib/alta/gargalo";
import { OPCOES_TOM, preencher, type Textos } from "@/lib/alta/textos";
import type { EstadoJornada } from "@/lib/jornada";
import { concluirBoasVindas, darConsentimento, salvarCadastro, salvarGargalo, type CampoCadastro, type Placar } from "./acoes";

// Jornada do primeiro acesso (seção 5): consentimento → cadastro → Mapa do Gargalo → resultado → menu.

type Bolha = { de: "alta" | "eu"; texto: string };
type Resultado = { notasPorPilar: Record<string, number>; gargalo1: number; gargalo2: number; explicacao: string };
type Passo =
  | { tipo: "consentimento" }
  | { tipo: "cadastro"; i: number }
  | { tipo: "placar"; i: number }
  | { tipo: "afirmacoes"; i: number }
  | { tipo: "salvando" }
  | { tipo: "resultado"; resultado: Resultado }
  | { tipo: "menu"; boasVindas: boolean };

const CADASTRO: { campo: CampoCadastro; chave: keyof Textos }[] = [
  { campo: "nome", chave: "cadastroNome" },
  { campo: "negocio", chave: "cadastroNegocio" },
  { campo: "cliente_ideal", chave: "cadastroCliente" },
  { campo: "oferta", chave: "cadastroOferta" },
  { campo: "tom", chave: "cadastroTom" },
];

const PLACAR: { chave: keyof Textos; campo: keyof Placar | "objetivo"; tipo: "reais" | "horas" | "texto" }[] = [
  { chave: "placarFaturamento", campo: "faturamento", tipo: "reais" },
  { chave: "placarLucro", campo: "lucro", tipo: "reais" },
  { chave: "placarTicket", campo: "ticket_medio", tipo: "reais" },
  { chave: "placarHoras", campo: "horas_semana", tipo: "horas" },
  { chave: "placarObjetivo", campo: "objetivo", tipo: "texto" },
];

const MENU = [
  { n: 1, titulo: "Conteúdo da semana", href: "/conteudo" },
  { n: 2, titulo: "Ideia rápida", href: "/ideia" },
  { n: 3, titulo: "Me tira uma dúvida", href: "/duvida" },
  { n: 4, titulo: "Meu perfil", href: "/perfil" },
];

/** "R$ 12.500,90" → 12500.9 */
function lerReais(t: string): number | null {
  const limpo = t.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(limpo);
  return Number.isFinite(n) ? n : null;
}

const botao = "rounded-xl bg-marca px-4 py-3 font-medium text-white transition hover:bg-marca-forte disabled:opacity-60";
const botaoClaro = "rounded-xl border border-borda bg-cartao px-4 py-3 font-medium transition hover:border-marca disabled:opacity-60";

export default function Jornada({ estado, textos }: { estado: EstadoJornada; textos: Textos }) {
  const router = useRouter();
  const [nome, setNome] = useState(estado.nome.split(" ")[0]);
  const t = (chave: keyof Textos) => preencher(textos[chave], { nome });

  const inicial = (): { passo: Passo; bolhas: Bolha[] } => {
    switch (estado.etapa) {
      case "consentimento":
        return { passo: { tipo: "consentimento" }, bolhas: [{ de: "alta", texto: textos.boasVindas }] };
      case "cadastro":
        return {
          passo: { tipo: "cadastro", i: estado.passoCadastro },
          bolhas: [{ de: "alta", texto: preencher(textos[CADASTRO[estado.passoCadastro].chave], { nome }) }],
        };
      case "gargalo":
        return {
          passo: { tipo: "placar", i: 0 },
          bolhas: [
            { de: "alta", texto: textos.gargaloIntroPlacar },
            { de: "alta", texto: textos.placarFaturamento },
          ],
        };
      default:
        return {
          passo: { tipo: "menu", boasVindas: estado.etapa === "menu-boas-vindas" },
          bolhas: [{ de: "alta", texto: preencher(estado.etapa === "menu-boas-vindas" ? textos.menuBoasVindas : textos.menuCurto, { nome }) }],
        };
    }
  };

  const [{ passo, bolhas }, setConversa] = useState(inicial);
  const [aviso, setAviso] = useState("");
  const [ocupado, iniciar] = useTransition();
  const [resposta, setResposta] = useState("");
  const [placar, setPlacar] = useState<Placar & { objetivo: string }>({ faturamento: null, lucro: null, ticket_medio: null, horas_semana: null, objetivo: "" });
  const [notas, setNotas] = useState<(number | null)[]>(Array(AFIRMACOES.length).fill(null));
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [bolhas.length, passo]);

  function avancar(novo: Passo, ...novas: Bolha[]) {
    setConversa((c) => ({ passo: novo, bolhas: [...c.bolhas, ...novas] }));
    setResposta("");
    setAviso("");
  }

  // --- Ações de cada passo ---

  function aceitar() {
    iniciar(async () => {
      const r = await darConsentimento();
      if (!r.ok) return setAviso(r.aviso);
      avancar({ tipo: "cadastro", i: 0 }, { de: "eu", texto: "SIM" }, { de: "alta", texto: t("cadastroNome") });
    });
  }

  function responderCadastro(i: number, valor: string) {
    iniciar(async () => {
      const r = await salvarCadastro(CADASTRO[i].campo, valor);
      if (!r.ok) return setAviso(r.aviso);
      const novoNome = CADASTRO[i].campo === "nome" ? r.nome : nome;
      setNome(novoNome);
      const eu: Bolha = { de: "eu", texto: valor.trim() };
      if (i < CADASTRO.length - 1) {
        avancar({ tipo: "cadastro", i: i + 1 }, eu, { de: "alta", texto: preencher(textos[CADASTRO[i + 1].chave], { nome: novoNome }) });
      } else {
        avancar(
          { tipo: "placar", i: 0 },
          eu,
          { de: "alta", texto: preencher(textos.cadastroFechamento, { nome: novoNome }) },
          { de: "alta", texto: textos.gargaloIntroPlacar },
          { de: "alta", texto: textos.placarFaturamento },
        );
      }
    });
  }

  function responderPlacar(i: number, valor: string | null) {
    const p = PLACAR[i];
    let exibido = valor ?? "Não sei";
    if (p.tipo === "texto") {
      if (!valor?.trim()) return setAviso("Me conta só um pouquinho, pode ser bem curto 😉");
      setPlacar((x) => ({ ...x, objetivo: valor.trim() }));
    } else {
      const n = valor === null ? null : p.tipo === "reais" ? lerReais(valor) : lerReais(valor);
      if (valor !== null && n === null) return setAviso("Me passa só o número, tá? Se não souber, toca em Não sei.");
      if (n !== null) exibido = p.tipo === "reais" ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : `${n} horas`;
      setPlacar((x) => ({ ...x, [p.campo]: n }));
    }
    const eu: Bolha = { de: "eu", texto: exibido };
    if (i < PLACAR.length - 1) avancar({ tipo: "placar", i: i + 1 }, eu, { de: "alta", texto: t(PLACAR[i + 1].chave) });
    else avancar({ tipo: "afirmacoes", i: 0 }, eu, { de: "alta", texto: textos.gargaloIntroAfirmacoes });
  }

  function darNota(i: number, n: number) {
    const novas = notas.map((x, j) => (j === i ? n : x));
    setNotas(novas);
    if (i < AFIRMACOES.length - 1) return setConversa((c) => ({ ...c, passo: { tipo: "afirmacoes", i: i + 1 } }));

    setConversa((c) => ({ ...c, passo: { tipo: "salvando" } }));
    iniciar(async () => {
      const { objetivo, ...numeros } = placar;
      const r = await salvarGargalo(numeros, objetivo, novas as number[]);
      if (!r.ok) {
        setAviso(r.aviso);
        return setConversa((c) => ({ ...c, passo: { tipo: "afirmacoes", i } }));
      }
      setConversa((c) => ({ ...c, passo: { tipo: "resultado", resultado: r } }));
    });
  }

  function irParaMenu() {
    avancar({ tipo: "menu", boasVindas: true }, { de: "alta", texto: t("menuBoasVindas") });
  }

  function escolher(href: string, boasVindas: boolean) {
    iniciar(async () => {
      if (boasVindas) await concluirBoasVindas();
      router.push(href);
    });
  }

  // --- Tela ---

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 py-4">
        {bolhas.map((b, i) => (
          <div key={i} className={b.de === "alta" ? "flex justify-start" : "flex justify-end"}>
            <div
              className={
                b.de === "alta"
                  ? "max-w-[88%] rounded-2xl rounded-tl-sm border border-borda bg-cartao px-4 py-3 text-[15px] leading-relaxed"
                  : "max-w-[80%] rounded-2xl rounded-tr-sm bg-marca px-4 py-3 text-[15px] text-white"
              }
            >
              <TextoAlta texto={b.texto} />
            </div>
          </div>
        ))}

        {passo.tipo === "afirmacoes" && (
          <CartaoAfirmacao i={passo.i} nota={notas[passo.i]} onNota={(n) => darNota(passo.i, n)} onVoltar={() => setConversa((c) => ({ ...c, passo: { tipo: "afirmacoes", i: Math.max(0, passo.i - 1) } }))} />
        )}
        {passo.tipo === "salvando" && <p className="text-center text-sm text-suave">Calculando o seu Mapa do Gargalo…</p>}
        {passo.tipo === "resultado" && <CartaoResultado resultado={passo.resultado} frase={textos.gargaloFrase} />}
        <div ref={fim} />
      </div>

      {aviso && <p role="status" className="mb-3 rounded-xl bg-marca-clara px-4 py-3 text-sm">{aviso}</p>}

      {/* Área de resposta */}
      <div className="sticky bottom-0 -mx-4 border-t border-borda bg-fundo/95 px-4 pb-4 pt-3 backdrop-blur">
        {passo.tipo === "consentimento" && (
          <div className="space-y-2">
            <button onClick={aceitar} disabled={ocupado} className={`${botao} w-full`}>SIM, pode guardar 💜</button>
            <p className="text-center text-xs text-suave">
              Leia a <a href="/privacidade" className="underline" target="_blank">política de privacidade</a>. Nunca peço CPF, senhas ou dados bancários.
            </p>
          </div>
        )}

        {passo.tipo === "cadastro" && CADASTRO[passo.i].campo === "tom" && (
          <div className="grid gap-2">
            {OPCOES_TOM.map((o) => (
              <button key={o} onClick={() => responderCadastro(passo.i, o)} disabled={ocupado} className={botaoClaro}>{o}</button>
            ))}
          </div>
        )}

        {passo.tipo === "cadastro" && CADASTRO[passo.i].campo !== "tom" && (
          <CampoTexto valor={resposta} onMudar={setResposta} ocupado={ocupado} onEnviar={() => responderCadastro(passo.i, resposta)} />
        )}

        {passo.tipo === "placar" && (
          <div className="space-y-2">
            <CampoTexto
              valor={resposta}
              onMudar={setResposta}
              ocupado={ocupado}
              teclado={PLACAR[passo.i].tipo === "texto" ? "text" : "decimal"}
              dica={PLACAR[passo.i].tipo === "reais" ? "Ex.: 8.500" : PLACAR[passo.i].tipo === "horas" ? "Ex.: 40" : "Escreve do seu jeito"}
              onEnviar={() => responderPlacar(passo.i, resposta)}
            />
            {PLACAR[passo.i].tipo !== "texto" && (
              <button onClick={() => responderPlacar(passo.i, null)} className={`${botaoClaro} w-full py-2 text-sm`}>Não sei</button>
            )}
          </div>
        )}

        {passo.tipo === "resultado" && (
          <button onClick={irParaMenu} className={`${botao} w-full`}>Bora! O que a gente faz agora?</button>
        )}

        {passo.tipo === "menu" && (
          <div className="grid grid-cols-2 gap-2">
            {MENU.map((m) => (
              <button key={m.n} onClick={() => escolher(m.href, passo.boasVindas)} disabled={ocupado} className={`${botaoClaro} text-left text-sm`}>
                <span className="mr-1 font-semibold text-marca">{m.n}</span> {m.titulo}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampoTexto({ valor, onMudar, onEnviar, ocupado, teclado = "text", dica = "Escreve aqui…" }: {
  valor: string; onMudar: (v: string) => void; onEnviar: () => void; ocupado: boolean; teclado?: "text" | "decimal"; dica?: string;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valor.trim()) onEnviar(); }} className="flex gap-2">
      <input
        autoFocus
        value={valor}
        onChange={(e) => onMudar(e.target.value)}
        inputMode={teclado}
        maxLength={500}
        placeholder={dica}
        aria-label="Sua resposta"
        className="min-w-0 flex-1 rounded-xl border border-borda bg-cartao px-4 py-3 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
      />
      <button type="submit" disabled={ocupado || !valor.trim()} className={botao} aria-label="Enviar">➜</button>
    </form>
  );
}

function CartaoAfirmacao({ i, nota, onNota, onVoltar }: { i: number; nota: number | null; onNota: (n: number) => void; onVoltar: () => void }) {
  const a = AFIRMACOES[i];
  return (
    <div className="rounded-2xl border border-borda bg-cartao p-5">
      <div className="mb-1 flex items-center justify-between text-xs text-suave">
        <span>{PILARES[a.pilar - 1]}</span>
        <span>{i + 1} de {AFIRMACOES.length}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-marca-clara">
        <div className="h-full bg-marca transition-all" style={{ width: `${(i / AFIRMACOES.length) * 100}%` }} />
      </div>
      <p className="mb-4 text-lg font-medium">“{a.texto}”</p>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            onClick={() => onNota(n)}
            aria-label={`Nota ${n}`}
            className={`rounded-lg border py-2.5 text-sm font-medium transition ${nota === n ? "border-marca bg-marca text-white" : "border-borda hover:border-marca"}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-suave">
        <span>0 = não é a minha realidade</span>
        <span>10 = é exatamente assim</span>
      </div>
      {i > 0 && <button onClick={onVoltar} className="mt-3 text-sm text-marca hover:underline">← Voltar</button>}
    </div>
  );
}

function CartaoResultado({ resultado, frase }: { resultado: Resultado; frase: string }) {
  return (
    <div className="rounded-2xl border border-borda bg-cartao p-5">
      <h2 className="mb-4 text-lg font-semibold">Seu Mapa do Gargalo</h2>
      <ul className="space-y-3">
        {PILARES.map((nomePilar, idx) => {
          const p = idx + 1;
          const nota = resultado.notasPorPilar[String(p)];
          const destaque = p === resultado.gargalo1 ? "principal" : p === resultado.gargalo2 ? "secundário" : null;
          return (
            <li key={p}>
              <div className="mb-1 flex justify-between text-sm">
                <span className={destaque ? "font-semibold" : undefined}>
                  {p}. {nomePilar}
                  {destaque && <span className="ml-2 rounded-full bg-marca-clara px-2 py-0.5 text-xs text-marca">gargalo {destaque}</span>}
                </span>
                <span className="tabular-nums">{nota.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-marca-clara">
                <div className={`h-full rounded-full ${destaque ? "bg-marca" : "bg-marca/40"}`} style={{ width: `${nota * 10}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 text-[15px] leading-relaxed">
        <TextoAlta texto={resultado.explicacao} />
        <p className="mt-3 font-medium">{frase}</p>
      </div>
    </div>
  );
}
