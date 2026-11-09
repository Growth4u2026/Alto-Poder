import { Suspense } from "react";
import Link from "next/link";
import { PILARES } from "@/lib/alta/gargalo";
import { calcularMapa, carregarAlunos, exigirAdmin, type MapaTurma } from "@/lib/admin";
import PainelAlunos from "./painel-alunos";

export default function Admin() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Painel da Alta</h1>
          <p className="text-sm text-suave">Lista de acesso, alunos e mapa da turma</p>
        </div>
        <Link href="/inicio" className="text-sm text-marca hover:underline">← Voltar para o app</Link>
      </div>
      <Suspense fallback={<p className="text-suave">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  const admin = await exigirAdmin();
  const alunos = await carregarAlunos();
  const mapa = calcularMapa(alunos);
  const ativos = alunos.filter((a) => a.status === "ativo" && a.plano !== "admin");

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Alunos ativos" valor={ativos.length} />
        <Numero rotulo="Já entraram" valor={ativos.filter((a) => a.ultimo_acesso_em).length} />
        <Numero rotulo="Fizeram o gargalo" valor={mapa.total} />
        <Numero rotulo="Querem mentoria" valor={alunos.filter((a) => a.quer_mentoria).length} />
      </section>

      <MapaDaTurma mapa={mapa} />

      <PainelAlunos alunos={alunos} meuId={admin.id} />
    </div>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-borda bg-cartao p-4">
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="text-sm text-suave">{rotulo}</p>
    </div>
  );
}

function MapaDaTurma({ mapa }: { mapa: MapaTurma }) {
  const maior = Math.max(1, ...mapa.principal);
  return (
    <section className="rounded-2xl border border-borda bg-cartao p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Mapa da turma</h2>
        <p className="text-sm text-suave">
          Anônimo · {mapa.total} aluno{mapa.total === 1 ? "" : "s"} com diagnóstico (sem contar admins)
        </p>
      </div>
      {mapa.total === 0 ? (
        <p className="text-suave">Ainda ninguém fez o Mapa do Gargalo.</p>
      ) : (
        <ul className="space-y-4">
          {PILARES.map((nome, i) => (
            <li key={nome}>
              <div className="mb-1 flex flex-wrap justify-between gap-x-4 text-sm">
                <span className="font-medium">{i + 1}. {nome}</span>
                <span className="text-suave">
                  <strong className="text-texto">{mapa.principal[i]}</strong> como principal · {mapa.secundario[i]} como secundário · média{" "}
                  <strong className="text-texto">{mapa.media[i]?.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</strong>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-marca-clara" role="img" aria-label={`${mapa.principal[i]} alunos com ${nome} como gargalo principal`}>
                <div className="h-full rounded-full bg-marca" style={{ width: `${(mapa.principal[i] / maior) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
