import Link from "next/link";

// Tela provisória das funções que entram nas próximas tarefas da Fase 1.
export default function EmConstrucao({ titulo, descricao, tarefa }: { titulo: string; descricao: string; tarefa: string }) {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
      <Link href="/inicio" className="text-sm text-marca hover:underline">← Voltar para o menu</Link>
      <div className="mt-6 rounded-2xl border border-borda bg-cartao p-6">
        <h1 className="text-xl font-semibold">{titulo}</h1>
        <p className="mt-2 text-suave">{descricao}</p>
        <p className="mt-4 rounded-xl bg-marca-clara px-4 py-3 text-sm">Em construção · tarefa {tarefa} do plano.</p>
      </div>
    </main>
  );
}
