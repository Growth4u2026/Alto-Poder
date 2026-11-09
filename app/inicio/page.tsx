import { Suspense } from "react";
import Link from "next/link";
import { ehAdmin } from "@/lib/admin";
import { carregarTextos } from "@/lib/alta/textos-servidor";
import { estadoDaJornada } from "@/lib/jornada";
import { alunoLogado } from "@/lib/sessao";
import { sair } from "@/app/entrar/acoes";
import Jornada from "./jornada";

const NOME_PLANO = { alto_poder: "ALTO PODER", start: "Growth Start", master: "Growth Master", admin: "Admin" } as const;

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-8 pt-4">
      <Suspense fallback={<p className="mt-8 text-center text-suave">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  const aluno = await alunoLogado();
  const [estado, textos] = await Promise.all([estadoDaJornada(aluno), carregarTextos()]);

  return (
    <>
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-borda bg-fundo/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={36} height={36} className="rounded-xl" />
          <div>
            <p className="font-semibold leading-tight">Alta</p>
            <p className="text-xs text-suave">{NOME_PLANO[aluno.plano]}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {ehAdmin(aluno) && (
            <Link href="/admin" className="rounded-lg bg-marca-clara px-3 py-1.5 text-sm font-medium text-marca">Painel</Link>
          )}
          <form action={sair}>
            <button className="text-sm text-marca hover:underline">Sair</button>
          </form>
        </div>
      </header>
      <Jornada estado={estado} textos={textos} />
    </>
  );
}
