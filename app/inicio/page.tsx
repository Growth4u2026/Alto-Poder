import { Suspense } from "react";
import { redirect } from "next/navigation";
import { alunoPorAuthId } from "@/lib/acesso";
import { supabaseDoAluno } from "@/lib/supabase/servidor";
import { sair } from "@/app/entrar/acoes";

const NOME_PLANO = { alto_poder: "ALTO PODER", start: "Growth Start", master: "Growth Master", admin: "Admin" } as const;

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8">
      <Suspense fallback={<p className="text-suave">Carregando…</p>}>
        <Painel />
      </Suspense>
    </main>
  );
}

async function Painel() {
  const supabase = await supabaseDoAluno();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");

  const aluno = await alunoPorAuthId(data.user.id);
  if (!aluno) {
    await supabase.auth.signOut();
    redirect("/entrar?erro=fora");
  }

  return (
    <>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={40} height={40} className="rounded-xl" />
          <div>
            <p className="font-semibold">Alta</p>
            <p className="text-xs text-suave">{NOME_PLANO[aluno.plano]}</p>
          </div>
        </div>
        <form action={sair}>
          <button className="text-sm text-marca hover:underline">Sair</button>
        </form>
      </header>

      <section className="mt-8 rounded-2xl border border-borda bg-cartao p-6">
        <h1 className="text-xl font-semibold">Oi, {aluno.nome.split(" ")[0]}! 💜</h1>
        <p className="mt-2 text-suave">
          Você entrou. As boas-vindas, o cadastro e o Mapa do Gargalo chegam nas próximas etapas.
        </p>
      </section>
    </>
  );
}
