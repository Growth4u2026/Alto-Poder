import "server-only";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/servidor";

export type Aluno = {
  id: string;
  nome: string;
  email: string | null;
  plano: "alto_poder" | "start" | "master" | "admin";
  status: "ativo" | "inativo";
  primeiro_acesso: boolean;
  consentimento_lgpd_em: string | null;
};

const CAMPOS = "id, nome, email, plano, status, primeiro_acesso, consentimento_lgpd_em";

/** Procura o e-mail na lista de acesso (seção 10). Só conta quem está ativo. */
export async function buscarNaLista(email: string): Promise<Aluno | null> {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select(CAMPOS)
    .ilike("email", email.trim())
    .eq("status", "ativo")
    .maybeSingle();
  if (error) throw error;
  return data as Aluno | null;
}

/**
 * Depois do login: liga a conta do Supabase ao aluno da lista e registra o acesso.
 * Devolve null se a pessoa não estiver (mais) na lista.
 */
export async function vincularAluno(usuario: User): Promise<Aluno | null> {
  if (!usuario.email) return null;
  const aluno = await buscarNaLista(usuario.email);
  if (!aluno) return null;
  const { error } = await supabaseAdmin()
    .from("users")
    .update({ auth_id: usuario.id, ultimo_acesso_em: new Date().toISOString() })
    .eq("id", aluno.id);
  if (error) throw error;
  return aluno;
}

/** Aluno da sessão atual, ou null. */
export async function alunoPorAuthId(authId: string): Promise<Aluno | null> {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select(CAMPOS)
    .eq("auth_id", authId)
    .eq("status", "ativo")
    .maybeSingle();
  if (error) throw error;
  return data as Aluno | null;
}
