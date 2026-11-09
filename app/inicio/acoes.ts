"use server";

import { AFIRMACOES, calcularGargalo } from "@/lib/alta/gargalo";
import { explicarGargalo } from "@/lib/alta/resultado-gargalo";
import { OPCOES_TOM } from "@/lib/alta/textos";
import { alunoLogado } from "@/lib/sessao";
import { supabaseAdmin } from "@/lib/supabase/servidor";

const MAX = 500;
const limpar = (t: unknown) => (typeof t === "string" ? t.trim().slice(0, MAX) : "");

type Ok<T = object> = ({ ok: true } & T) | { ok: false; aviso: string };
const ERRO = { ok: false as const, aviso: "Deu uma travadinha aqui. Tenta de novo daqui a pouco?" };

/** 8.1 · Registra o "SIM". Antes disso nada do aluno é salvo. */
export async function darConsentimento(): Promise<Ok> {
  const aluno = await alunoLogado();
  const { error } = await supabaseAdmin()
    .from("users")
    .update({ consentimento_lgpd_em: new Date().toISOString() })
    .eq("id", aluno.id);
  return error ? ERRO : { ok: true };
}

const CAMPOS_CADASTRO = ["nome", "negocio", "cliente_ideal", "oferta", "tom"] as const;
export type CampoCadastro = (typeof CAMPOS_CADASTRO)[number];

/** 8.2 · Salva uma resposta do cadastro. */
export async function salvarCadastro(campo: CampoCadastro, valor: string): Promise<Ok<{ nome: string }>> {
  const aluno = await alunoLogado();
  if (!aluno.consentimento_lgpd_em) return { ok: false, aviso: "Antes preciso do seu SIM, tá?" };
  if (!CAMPOS_CADASTRO.includes(campo)) return ERRO;

  const texto = limpar(valor);
  if (!texto) return { ok: false, aviso: "Me conta só um pouquinho, pode ser bem curto 😉" };
  if (campo === "tom" && !(OPCOES_TOM as readonly string[]).includes(texto)) return ERRO;

  const db = supabaseAdmin();
  if (campo === "nome") {
    const nome = texto.slice(0, 60);
    const [u, p] = await Promise.all([
      db.from("users").update({ nome }).eq("id", aluno.id),
      db.from("profiles").upsert({ user_id: aluno.id, atualizado_em: new Date().toISOString() }, { onConflict: "user_id" }),
    ]);
    return u.error || p.error ? ERRO : { ok: true, nome };
  }

  const { error } = await db
    .from("profiles")
    .upsert({ user_id: aluno.id, [campo]: texto, atualizado_em: new Date().toISOString() }, { onConflict: "user_id" });
  return error ? ERRO : { ok: true, nome: aluno.nome };
}

export type Placar = { faturamento: number | null; lucro: number | null; ticket_medio: number | null; horas_semana: number | null };

const numeroOuNulo = (v: unknown, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v * 100) / 100 : null;

/** Seção 9 · Salva o diagnóstico (e o placar inicial, se for o primeiro) e devolve o resultado. */
export async function salvarGargalo(
  placar: Placar,
  objetivo: string,
  notas: number[],
): Promise<Ok<{ notasPorPilar: Record<string, number>; gargalo1: number; gargalo2: number; explicacao: string }>> {
  const aluno = await alunoLogado();
  if (!aluno.consentimento_lgpd_em) return { ok: false, aviso: "Antes preciso do seu SIM, tá?" };

  let resultado;
  try {
    resultado = calcularGargalo(notas);
  } catch {
    return { ok: false, aviso: `Faltou responder alguma das ${AFIRMACOES.length} frases. Confere pra mim?` };
  }

  const db = supabaseAdmin();
  const p = {
    faturamento: numeroOuNulo(placar.faturamento, 1e9),
    lucro: numeroOuNulo(placar.lucro, 1e9),
    ticket_medio: numeroOuNulo(placar.ticket_medio, 1e9),
    horas_semana: numeroOuNulo(placar.horas_semana, 168),
  };

  const { error } = await db.from("diagnostics").insert({
    user_id: aluno.id,
    respostas: { notas, placar: p },
    notas_por_pilar: resultado.notasPorPilar,
    gargalo_1: resultado.gargalo1,
    gargalo_2: resultado.gargalo2,
    objetivo: limpar(objetivo) || null,
  });
  if (error) return ERRO;

  // Placar inicial só uma vez (ponto de partida do programa).
  const { count } = await db.from("scoreboard").select("id", { count: "exact", head: true }).eq("user_id", aluno.id).eq("origem", "inicial");
  if (!count) {
    const hoje = new Date();
    const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
    await db.from("scoreboard").insert({ user_id: aluno.id, mes, origem: "inicial", ...p });
  }

  return { ok: true, ...resultado, explicacao: explicarGargalo(resultado.gargalo1, aluno.nome) };
}

/** Depois do menu de boas-vindas: a partir daqui só o menu curto. */
export async function concluirBoasVindas(): Promise<Ok> {
  const aluno = await alunoLogado();
  const { error } = await supabaseAdmin().from("users").update({ primeiro_acesso: false }).eq("id", aluno.id);
  return error ? ERRO : { ok: true };
}
