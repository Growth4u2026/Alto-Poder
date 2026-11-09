"use server";

import { exigirAdmin } from "@/lib/admin";
import { calcularAcessoAte, lerCsv, PLANOS, validarAluno, type NovoAluno, type Plano } from "@/lib/lista-acesso";
import { supabaseAdmin } from "@/lib/supabase/servidor";

type Resultado = { ok: true; mensagem: string } | { ok: false; erro: string };

/** Data de hoje no fuso de São Paulo, "AAAA-MM-DD". */
function hojeSP() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function adicionarAluno(dados: { nome: string; email: string; whatsapp: string; plano: string; data_entrada: string }): Promise<Resultado> {
  await exigirAdmin();
  const r = validarAluno(dados, hojeSP());
  if (!r.ok) return { ok: false, erro: `Não deu: ${r.erro}.` };

  const db = supabaseAdmin();
  const { data: existe } = await db.from("users").select("id").ilike("email", r.aluno.email).maybeSingle();
  if (existe) return { ok: false, erro: `${r.aluno.email} já está na lista. Mude o plano ou o status na tabela abaixo.` };

  const { error } = await db.from("users").insert({ ...r.aluno, status: "ativo" });
  if (error) return { ok: false, erro: error.code === "23505" ? "Esse WhatsApp já está cadastrado para outra pessoa." : "Não consegui salvar. Tenta de novo?" };
  return { ok: true, mensagem: `${r.aluno.nome} entrou na lista. Já pode acessar com ${r.aluno.email}.` };
}

/** Importa vários de uma vez. Quem já está na lista tem plano e datas atualizados (o nome que a pessoa escolheu é mantido). */
export async function importarCsv(texto: string): Promise<Resultado & { erros?: string[] }> {
  await exigirAdmin();
  if (texto.length > 500_000) return { ok: false, erro: "Planilha grande demais. Divida em partes de até uns 5 mil alunos." };
  const { alunos, erros } = lerCsv(texto, hojeSP());
  if (!alunos.length) return { ok: false, erro: erros[0] ?? "Nenhum aluno encontrado na planilha.", erros };

  const db = supabaseAdmin();
  const { data: atuais, error: e1 } = await db.from("users").select("id, email");
  if (e1) return { ok: false, erro: "Não consegui ler a lista atual. Tenta de novo?" };
  const porEmail = new Map(atuais!.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u.id]));

  const novos: NovoAluno[] = alunos.filter((a) => !porEmail.has(a.email));
  const existentes = alunos.filter((a) => porEmail.has(a.email));

  if (novos.length) {
    const { error } = await db.from("users").insert(novos.map((a) => ({ ...a, status: "ativo" })));
    if (error) return { ok: false, erro: "Não consegui salvar os novos alunos (pode ter WhatsApp repetido). Nada foi gravado.", erros };
  }
  let atualizados = 0;
  for (const a of existentes) {
    const { error } = await db
      .from("users")
      .update({ plano: a.plano, data_entrada: a.data_entrada, acesso_ate: a.acesso_ate, status: "ativo", ...(a.whatsapp ? { whatsapp: a.whatsapp } : {}) })
      .eq("id", porEmail.get(a.email)!);
    if (error) erros.push(`${a.email}: não consegui atualizar`);
    else atualizados++;
  }

  const partes = [`${novos.length} novo${novos.length === 1 ? "" : "s"}`, `${atualizados} atualizado${atualizados === 1 ? "" : "s"}`];
  return { ok: true, mensagem: `Importação concluída: ${partes.join(", ")}.${erros.length ? ` ${erros.length} linha(s) com problema.` : ""}`, erros };
}

export async function mudarPlano(id: string, plano: string): Promise<Resultado> {
  const admin = await exigirAdmin();
  if (!(PLANOS as readonly string[]).includes(plano)) return { ok: false, erro: "Plano inválido." };
  if (id === admin.id && plano !== "admin") return { ok: false, erro: "Você não pode tirar o seu próprio acesso de admin por aqui." };

  const db = supabaseAdmin();
  const { data: u } = await db.from("users").select("data_entrada").eq("id", id).maybeSingle();
  if (!u) return { ok: false, erro: "Aluno não encontrado." };
  const { error } = await db.from("users").update({ plano, acesso_ate: calcularAcessoAte(plano as Plano, u.data_entrada) }).eq("id", id);
  return error ? { ok: false, erro: "Não consegui salvar. Tenta de novo?" } : { ok: true, mensagem: "Plano atualizado." };
}

export async function mudarStatus(id: string, status: string): Promise<Resultado> {
  const admin = await exigirAdmin();
  if (status !== "ativo" && status !== "inativo") return { ok: false, erro: "Status inválido." };
  if (id === admin.id && status === "inativo") return { ok: false, erro: "Você não pode desativar o seu próprio acesso." };
  const { error } = await supabaseAdmin().from("users").update({ status }).eq("id", id);
  return error ? { ok: false, erro: "Não consegui salvar. Tenta de novo?" } : { ok: true, mensagem: status === "ativo" ? "Acesso liberado." : "Acesso bloqueado. O histórico continua guardado." };
}
