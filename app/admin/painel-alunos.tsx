"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PILARES } from "@/lib/alta/gargalo";
import type { LinhaAluno } from "@/lib/admin";
import { NOME_PLANO, PLANOS } from "@/lib/lista-acesso";
import { adicionarAluno, importarCsv, mudarPlano, mudarStatus } from "./acoes";

const campo = "w-full rounded-xl border border-borda bg-fundo px-3 py-2 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/30";
const botao = "rounded-xl bg-marca px-4 py-2 font-medium text-white transition hover:bg-marca-forte disabled:opacity-60";

const data = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");

type Aviso = { tipo: "ok" | "erro"; texto: string; detalhes?: string[] } | null;

export default function PainelAlunos({ alunos, meuId }: { alunos: LinhaAluno[]; meuId: string }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [aviso, setAviso] = useState<Aviso>(null);
  const [busca, setBusca] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativo");
  const [aba, setAba] = useState<"um" | "varios" | null>(null);

  const lista = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return alunos.filter(
      (a) =>
        (!filtroPlano || a.plano === filtroPlano) &&
        (!filtroStatus || a.status === filtroStatus) &&
        (!b || a.nome.toLowerCase().includes(b) || (a.email ?? "").includes(b)),
    );
  }, [alunos, busca, filtroPlano, filtroStatus]);

  function executar(acao: () => Promise<{ ok: boolean; mensagem?: string; erro?: string; erros?: string[] }>, depois?: () => void) {
    setAviso(null);
    iniciar(async () => {
      const r = await acao();
      setAviso(r.ok ? { tipo: "ok", texto: r.mensagem!, detalhes: r.erros } : { tipo: "erro", texto: r.erro!, detalhes: r.erros });
      if (r.ok) {
        depois?.();
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-borda bg-cartao p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Lista de acesso</h2>
        <div className="flex gap-2">
          <button onClick={() => setAba(aba === "um" ? null : "um")} className={botao}>+ Adicionar aluno</button>
          <button onClick={() => setAba(aba === "varios" ? null : "varios")} className="rounded-xl border border-borda px-4 py-2 font-medium hover:border-marca">
            Importar planilha
          </button>
        </div>
      </div>

      {aba === "um" && <FormUm ocupado={ocupado} onEnviar={(d, limpar) => executar(() => adicionarAluno(d), limpar)} />}
      {aba === "varios" && <FormVarios ocupado={ocupado} onEnviar={(t, limpar) => executar(() => importarCsv(t), limpar)} />}

      {aviso && (
        <div role="status" className={`mb-4 rounded-xl px-4 py-3 text-sm ${aviso.tipo === "ok" ? "bg-marca-clara" : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"}`}>
          {aviso.texto}
          {!!aviso.detalhes?.length && (
            <ul className="mt-2 list-disc pl-5">
              {aviso.detalhes.slice(0, 20).map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" aria-label="Buscar" className={campo} />
        <select value={filtroPlano} onChange={(e) => setFiltroPlano(e.target.value)} aria-label="Filtrar por plano" className={campo}>
          <option value="">Todos os planos</option>
          {PLANOS.map((p) => <option key={p} value={p}>{NOME_PLANO[p]}</option>)}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} aria-label="Filtrar por status" className={campo}>
          <option value="ativo">Ativos</option>
          <option value="inativo">Bloqueados</option>
          <option value="">Todos</option>
        </select>
      </div>
      <p className="mb-2 text-sm text-suave">{lista.length} de {alunos.length}</p>

      <ul className="divide-y divide-borda">
        {lista.map((a) => (
          <li key={a.id} className={`grid gap-3 py-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center ${a.status === "inativo" ? "opacity-60" : ""}`}>
            <div className="min-w-0">
              <p className="font-medium">
                {a.nome}
                {a.quer_mentoria && <span className="ml-2 rounded-full bg-marca-clara px-2 py-0.5 text-xs text-marca">quer mentoria</span>}
              </p>
              <p className="truncate text-sm text-suave">{a.email}{a.whatsapp ? ` · ${a.whatsapp}` : ""}</p>
              <p className="text-xs text-suave">
                Entrada {data(a.data_entrada)}{a.acesso_ate ? ` · acesso até ${data(a.acesso_ate)}` : ""} · último acesso {a.ultimo_acesso_em ? data(a.ultimo_acesso_em) : "nunca"}
              </p>
            </div>
            <div className="text-sm">
              {a.gargalo_1 ? (
                <>
                  <p><span className="text-suave">Gargalo:</span> <strong>{PILARES[a.gargalo_1 - 1]}</strong></p>
                  <p className="text-suave">Secundário: {PILARES[a.gargalo_2! - 1]}</p>
                </>
              ) : (
                <p className="text-suave">{a.cadastro_completo ? "Cadastro feito, falta o gargalo" : a.ultimo_acesso_em ? "Começou o cadastro" : "Ainda não entrou"}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={a.plano}
                disabled={ocupado}
                onChange={(e) => executar(() => mudarPlano(a.id, e.target.value))}
                aria-label={`Plano de ${a.nome}`}
                className="rounded-lg border border-borda bg-fundo px-2 py-1.5 text-sm"
              >
                {PLANOS.map((p) => <option key={p} value={p}>{NOME_PLANO[p]}</option>)}
              </select>
              {a.id !== meuId && (
                <button
                  disabled={ocupado}
                  onClick={() => {
                    if (a.status === "ativo" && !confirm(`Bloquear o acesso de ${a.nome}? O histórico continua guardado e dá para liberar de novo depois.`)) return;
                    executar(() => mudarStatus(a.id, a.status === "ativo" ? "inativo" : "ativo"));
                  }}
                  className="rounded-lg border border-borda px-3 py-1.5 text-sm hover:border-marca"
                >
                  {a.status === "ativo" ? "Bloquear" : "Liberar"}
                </button>
              )}
            </div>
          </li>
        ))}
        {!lista.length && <li className="py-6 text-center text-suave">Ninguém por aqui com esse filtro.</li>}
      </ul>
    </section>
  );
}

function FormUm({ ocupado, onEnviar }: { ocupado: boolean; onEnviar: (d: { nome: string; email: string; whatsapp: string; plano: string; data_entrada: string }, limpar: () => void) => void }) {
  const vazio = { nome: "", email: "", whatsapp: "", plano: "alto_poder", data_entrada: "" };
  const [d, setD] = useState(vazio);
  const mudar = (k: keyof typeof vazio) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onEnviar(d, () => setD(vazio)); }} className="mb-5 grid gap-3 rounded-xl bg-marca-clara/50 p-4 sm:grid-cols-2">
      <label className="text-sm">Nome<input required value={d.nome} onChange={mudar("nome")} className={`${campo} mt-1`} /></label>
      <label className="text-sm">E-mail<input required type="email" value={d.email} onChange={mudar("email")} className={`${campo} mt-1`} /></label>
      <label className="text-sm">WhatsApp (opcional)<input value={d.whatsapp} onChange={mudar("whatsapp")} inputMode="tel" placeholder="11 98888-7777" className={`${campo} mt-1`} /></label>
      <label className="text-sm">Plano
        <select value={d.plano} onChange={mudar("plano")} className={`${campo} mt-1`}>
          {PLANOS.map((p) => <option key={p} value={p}>{NOME_PLANO[p]}</option>)}
        </select>
      </label>
      <label className="text-sm">Data de entrada<input type="date" value={d.data_entrada} onChange={mudar("data_entrada")} className={`${campo} mt-1`} /></label>
      <div className="flex items-end">
        <p className="text-xs text-suave">Sem data, vale hoje. Growth Start e Master ganham 12 meses de acesso automaticamente.</p>
      </div>
      <button disabled={ocupado} className={`${botao} sm:col-span-2`}>{ocupado ? "Salvando…" : "Adicionar à lista"}</button>
    </form>
  );
}

function FormVarios({ ocupado, onEnviar }: { ocupado: boolean; onEnviar: (texto: string, limpar: () => void) => void }) {
  const [texto, setTexto] = useState("");
  async function lerArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const buf = await f.arrayBuffer();
    // Excel em português costuma salvar em Windows-1252; tenta UTF-8 primeiro.
    let t = new TextDecoder("utf-8").decode(buf);
    if (t.includes("�")) t = new TextDecoder("windows-1252").decode(buf);
    setTexto(t);
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onEnviar(texto, () => setTexto("")); }} className="mb-5 space-y-3 rounded-xl bg-marca-clara/50 p-4">
      <p className="text-sm">
        No Excel ou Google Planilhas, monte as colunas <strong>nome</strong>, <strong>email</strong>, <strong>plano</strong> e <strong>data_entrada</strong> (whatsapp é opcional) e salve como <strong>CSV</strong>.
        Plano vazio vira ALTO PODER; data vazia vira hoje. Quem já está na lista tem plano e data atualizados.
      </p>
      <input type="file" accept=".csv,text/csv" onChange={lerArquivo} className="block text-sm" aria-label="Arquivo CSV" />
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        placeholder={"nome;email;plano;data_entrada\nAna Souza;ana@email.com;start;25/03/2026"}
        aria-label="Conteúdo da planilha"
        className={`${campo} font-mono text-sm`}
      />
      <button disabled={ocupado || !texto.trim()} className={botao}>{ocupado ? "Importando…" : "Importar"}</button>
    </form>
  );
}
