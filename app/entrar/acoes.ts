"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buscarNaLista, vincularAluno } from "@/lib/acesso";
import { supabaseDoAluno } from "@/lib/supabase/servidor";

export type Resultado = { ok: true } | { ok: false; aviso: string };

const ERRO_TECNICO = "Deu uma travadinha aqui. Tenta de novo daqui a pouco?";
// Texto 8.5. O contato da Growth4u entra quando for definido (tabela settings).
const FORA_DA_LISTA =
  "Oi! Esse acesso é exclusivo para alunos da Growth4u e participantes do ALTO PODER. Se você já é, fala com o time da Growth4u.";

export async function pedirAcesso(email: string): Promise<Resultado> {
  const limpo = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) return { ok: false, aviso: "Confere o e-mail? Parece que faltou alguma coisa." };

  try {
    if (!(await buscarNaLista(limpo))) return { ok: false, aviso: FORA_DA_LISTA };

    const origem = (await headers()).get("origin") ?? process.env.APP_URL;
    const supabase = await supabaseDoAluno();
    const { error } = await supabase.auth.signInWithOtp({
      email: limpo,
      options: { shouldCreateUser: true, emailRedirectTo: `${origem}/auth/retorno` },
    });
    if (error) {
      if (error.status === 429) return { ok: false, aviso: "Muitos pedidos seguidos. Espera uns minutinhos e tenta de novo, tá?" };
      console.error("signInWithOtp:", error.code ?? error.status);
      return { ok: false, aviso: ERRO_TECNICO };
    }
    return { ok: true };
  } catch (e) {
    console.error("pedirAcesso:", e instanceof Error ? e.message : e);
    return { ok: false, aviso: ERRO_TECNICO };
  }
}

export async function confirmarCodigo(email: string, codigo: string): Promise<Resultado> {
  const supabase = await supabaseDoAluno();
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: codigo.trim(),
    type: "email",
  });
  if (error || !data.user) return { ok: false, aviso: "Esse código não bateu ou já venceu. Confere e tenta de novo?" };

  if (!(await vincularAluno(data.user))) {
    await supabase.auth.signOut();
    return { ok: false, aviso: FORA_DA_LISTA };
  }
  redirect("/inicio");
}

export async function sair() {
  const supabase = await supabaseDoAluno();
  await supabase.auth.signOut();
  redirect("/entrar");
}
