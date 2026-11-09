import "server-only";
import { redirect } from "next/navigation";
import type { Aluno } from "@/lib/acesso";
import { alunoLogado } from "@/lib/sessao";
import { supabaseAdmin } from "@/lib/supabase/servidor";

/** E-mails de ADMIN_EMAILS (seção 14: só eles abrem o painel). */
export function emailsAdmin(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function ehAdmin(aluno: Pick<Aluno, "email">) {
  return !!aluno.email && emailsAdmin().includes(aluno.email.toLowerCase());
}

/** Para páginas e ações do admin: quem não está em ADMIN_EMAILS volta para o início. */
export async function exigirAdmin(): Promise<Aluno> {
  const aluno = await alunoLogado();
  if (!ehAdmin(aluno)) redirect("/inicio");
  return aluno;
}

export type LinhaAluno = {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  plano: Aluno["plano"];
  status: Aluno["status"];
  data_entrada: string;
  acesso_ate: string | null;
  ultimo_acesso_em: string | null;
  cadastro_completo: boolean;
  gargalo_1: number | null;
  gargalo_2: number | null;
  notas_por_pilar: Record<string, number> | null;
  quer_mentoria: boolean;
};

/** Todos os alunos da lista de acesso, com o diagnóstico mais recente de cada um. */
export async function carregarAlunos(): Promise<LinhaAluno[]> {
  const db = supabaseAdmin();
  const [usuarios, diagnosticos, perfis, leads] = await Promise.all([
    db.from("users")
      .select("id, nome, email, whatsapp, plano, status, data_entrada, acesso_ate, ultimo_acesso_em")
      .order("criado_em", { ascending: false }),
    db.from("diagnostics").select("user_id, gargalo_1, gargalo_2, notas_por_pilar, criado_em").order("criado_em", { ascending: false }),
    db.from("profiles").select("user_id, negocio, cliente_ideal, oferta, tom"),
    db.from("leads_mentoria").select("user_id"),
  ]);
  for (const r of [usuarios, diagnosticos, perfis, leads]) if (r.error) throw r.error;

  const ultimoDiag = new Map<string, { gargalo_1: number; gargalo_2: number; notas_por_pilar: Record<string, number> }>();
  for (const d of diagnosticos.data!) if (!ultimoDiag.has(d.user_id)) ultimoDiag.set(d.user_id, d);
  const completos = new Set(perfis.data!.filter((p) => p.negocio && p.cliente_ideal && p.oferta && p.tom).map((p) => p.user_id));
  const mentoria = new Set(leads.data!.map((l) => l.user_id));

  return usuarios.data!.map((u) => {
    const d = ultimoDiag.get(u.id);
    return {
      ...u,
      cadastro_completo: completos.has(u.id),
      gargalo_1: d?.gargalo_1 ?? null,
      gargalo_2: d?.gargalo_2 ?? null,
      notas_por_pilar: d?.notas_por_pilar ?? null,
      quer_mentoria: mentoria.has(u.id),
    } as LinhaAluno;
  });
}

export type MapaTurma = {
  total: number;
  principal: number[]; // índice 0 = pilar 1
  secundario: number[];
  media: (number | null)[];
};

/** Mapa da turma (F8): anônimo, só alunos ativos que não são admin e já fizeram o diagnóstico. */
export function calcularMapa(alunos: LinhaAluno[]): MapaTurma {
  const com = alunos.filter((a) => a.status === "ativo" && a.plano !== "admin" && a.notas_por_pilar);
  const principal = Array(6).fill(0);
  const secundario = Array(6).fill(0);
  const soma = Array(6).fill(0);
  for (const a of com) {
    principal[a.gargalo_1! - 1]++;
    secundario[a.gargalo_2! - 1]++;
    for (let p = 1; p <= 6; p++) soma[p - 1] += a.notas_por_pilar![String(p)] ?? 0;
  }
  return {
    total: com.length,
    principal,
    secundario,
    media: soma.map((s) => (com.length ? Math.round((s / com.length) * 10) / 10 : null)),
  };
}
