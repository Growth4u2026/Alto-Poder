// Regras da lista de acesso (seção 10). Arquivo puro, testável.

export const PLANOS = ["alto_poder", "start", "master", "admin"] as const;
export type Plano = (typeof PLANOS)[number];

export const NOME_PLANO: Record<Plano, string> = {
  alto_poder: "ALTO PODER",
  start: "Growth Start",
  master: "Growth Master",
  admin: "Admin",
};

export type NovoAluno = { nome: string; email: string; whatsapp: string | null; plano: Plano; data_entrada: string; acesso_ate: string | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Alunos do programa (start/master) têm 12 meses de acesso a partir da entrada. */
export function calcularAcessoAte(plano: Plano, dataEntrada: string): string | null {
  if (plano !== "start" && plano !== "master") return null;
  const [a, m, d] = dataEntrada.split("-").map(Number);
  const fim = new Date(Date.UTC(a + 1, m - 1, d));
  return fim.toISOString().slice(0, 10);
}

/** Aceita "start", "Growth Start", "ALTO PODER", "alto poder" etc. */
export function lerPlano(texto: string): Plano | null {
  const t = texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/growth\s*/, "").replace(/\s+/g, "_");
  if (!t) return "alto_poder";
  return (PLANOS as readonly string[]).includes(t) ? (t as Plano) : null;
}

/** "25/03/2026" ou "2026-03-25" → "2026-03-25". Vazio → hoje. */
export function lerData(texto: string, hoje: string): string | null {
  const t = texto.trim();
  if (!t) return hoje;
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return t;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

export function validarAluno(
  dados: { nome: string; email: string; whatsapp?: string; plano: string; data_entrada?: string },
  hoje: string,
): { ok: true; aluno: NovoAluno } | { ok: false; erro: string } {
  const nome = dados.nome.trim().slice(0, 80);
  const email = dados.email.trim().toLowerCase();
  if (!nome) return { ok: false, erro: "falta o nome" };
  if (!EMAIL.test(email)) return { ok: false, erro: `e-mail inválido (${email || "vazio"})` };
  const plano = lerPlano(dados.plano);
  if (!plano) return { ok: false, erro: `plano desconhecido (${dados.plano})` };
  const data = lerData(dados.data_entrada ?? "", hoje);
  if (!data) return { ok: false, erro: `data inválida (${dados.data_entrada})` };
  const whatsapp = (dados.whatsapp ?? "").replace(/\D/g, "") || null;
  return { ok: true, aluno: { nome, email, whatsapp, plano, data_entrada: data, acesso_ate: calcularAcessoAte(plano, data) } };
}

/**
 * Lê uma planilha CSV (vírgula ou ponto e vírgula, como o Excel em português salva).
 * Colunas reconhecidas pelo cabeçalho: nome, email, plano, data_entrada (ou entrada/data), whatsapp.
 */
export function lerCsv(texto: string, hoje: string) {
  const linhas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!linhas.length) return { alunos: [] as NovoAluno[], erros: ["A planilha está vazia."] };

  const sep = (linhas[0].match(/;/g)?.length ?? 0) >= (linhas[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const celulas = (l: string) => l.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, "$1").trim());
  const cab = celulas(linhas[0]).map((c) => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z_]/g, ""));
  const col = (...nomes: string[]) => cab.findIndex((c) => nomes.includes(c));
  const iNome = col("nome", "name");
  const iEmail = col("email", "e_mail", "mail");
  if (iNome < 0 || iEmail < 0) return { alunos: [], erros: ["A primeira linha precisa ter as colunas nome e email."] };
  const iPlano = col("plano", "plan");
  const iData = col("data_entrada", "dataentrada", "datadeentrada", "data_de_entrada", "entrada", "data");
  const iZap = col("whatsapp", "telefone", "celular", "zap");

  const alunos: NovoAluno[] = [];
  const erros: string[] = [];
  const vistos = new Set<string>();
  linhas.slice(1).forEach((l, i) => {
    const c = celulas(l);
    const r = validarAluno(
      { nome: c[iNome] ?? "", email: c[iEmail] ?? "", plano: iPlano >= 0 ? c[iPlano] ?? "" : "", data_entrada: iData >= 0 ? c[iData] : "", whatsapp: iZap >= 0 ? c[iZap] : "" },
      hoje,
    );
    if (!r.ok) return erros.push(`Linha ${i + 2}: ${r.erro}`);
    if (vistos.has(r.aluno.email)) return erros.push(`Linha ${i + 2}: e-mail repetido na planilha (${r.aluno.email})`);
    vistos.add(r.aluno.email);
    alunos.push(r.aluno);
  });
  return { alunos, erros };
}
