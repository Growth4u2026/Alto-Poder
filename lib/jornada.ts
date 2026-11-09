import "server-only";
import type { Aluno } from "@/lib/acesso";
import { supabaseAdmin } from "@/lib/supabase/servidor";

export type Perfil = { negocio: string | null; cliente_ideal: string | null; oferta: string | null; tom: string | null };

export type Diagnostico = {
  notas_por_pilar: Record<string, number>;
  gargalo_1: number;
  gargalo_2: number;
  criado_em: string;
};

export type Etapa = "consentimento" | "cadastro" | "gargalo" | "menu-boas-vindas" | "menu";

export type EstadoJornada = {
  etapa: Etapa;
  nome: string;
  /** Na etapa "cadastro": qual pergunta (0 a 4) é a próxima. */
  passoCadastro: number;
  perfil: Perfil | null;
  diagnostico: Diagnostico | null;
};

/** Descobre em que ponto da jornada (seção 5) o aluno está. */
export async function estadoDaJornada(aluno: Aluno): Promise<EstadoJornada> {
  const db = supabaseAdmin();
  const [{ data: perfil }, { data: diagnostico }] = await Promise.all([
    db.from("profiles").select("negocio, cliente_ideal, oferta, tom").eq("user_id", aluno.id).maybeSingle(),
    db.from("diagnostics")
      .select("notas_por_pilar, gargalo_1, gargalo_2, criado_em")
      .eq("user_id", aluno.id)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const base = { nome: aluno.nome, perfil: perfil as Perfil | null, diagnostico: diagnostico as Diagnostico | null, passoCadastro: 0 };

  if (!aluno.consentimento_lgpd_em) return { ...base, etapa: "consentimento" };

  // Pergunta 1 (nome) já respondida quando o perfil existe; as outras, pelo campo preenchido.
  if (!perfil) return { ...base, etapa: "cadastro", passoCadastro: 0 };
  const campos = ["negocio", "cliente_ideal", "oferta", "tom"] as const;
  const faltando = campos.findIndex((c) => !perfil[c]);
  if (faltando >= 0) return { ...base, etapa: "cadastro", passoCadastro: faltando + 1 };

  if (!diagnostico) return { ...base, etapa: "gargalo" };
  return { ...base, etapa: aluno.primeiro_acesso ? "menu-boas-vindas" : "menu" };
}
