import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { alunoPorAuthId, type Aluno } from "@/lib/acesso";
import { supabaseDoAluno } from "@/lib/supabase/servidor";

/** Aluno logado e ativo na lista. Se não houver, manda para o login. */
export async function alunoLogado(): Promise<Aluno> {
  await connection(); // sempre na hora do pedido (nunca pré-renderizado)
  const supabase = await supabaseDoAluno();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");
  const aluno = await alunoPorAuthId(data.user.id);
  if (!aluno) {
    await supabase.auth.signOut();
    redirect("/entrar?erro=fora");
  }
  return aluno;
}
