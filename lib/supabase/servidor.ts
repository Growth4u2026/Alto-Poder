import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as criarClienteBase } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Cliente com a sessão do aluno (lê e grava os cookies de login). */
export async function supabaseDoAluno() {
  const loja = await cookies();
  return createServerClient(url, chavePublica, {
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => loja.set(name, value, options));
        } catch {
          // Chamado durante a renderização de uma página: o proxy cuida de renovar os cookies.
        }
      },
    },
  });
}

/** Cliente com a chave secreta. Só no servidor; ignora as regras de acesso (RLS). */
export function supabaseAdmin() {
  return criarClienteBase(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
