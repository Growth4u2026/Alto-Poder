import "server-only";
import { supabaseAdmin } from "@/lib/supabase/servidor";
import { TEXTOS_PADRAO, type Textos } from "./textos";

/** Textos padrão + o que o admin tiver editado em settings.textos. */
export async function carregarTextos(): Promise<Textos> {
  const { data } = await supabaseAdmin().from("settings").select("valor").eq("chave", "textos").maybeSingle();
  const editados = (data?.valor ?? {}) as Partial<Textos>;
  const textos = { ...TEXTOS_PADRAO };
  for (const chave of Object.keys(TEXTOS_PADRAO) as (keyof Textos)[]) {
    if (typeof editados[chave] === "string" && editados[chave]) textos[chave] = editados[chave];
  }
  return textos;
}
