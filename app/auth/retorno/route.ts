import { NextResponse, type NextRequest } from "next/server";
import { vincularAluno } from "@/lib/acesso";
import { supabaseDoAluno } from "@/lib/supabase/servidor";

// Para onde o link do e-mail leva. Troca o código do link por uma sessão de login.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const supabase = await supabaseDoAluno();

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
      : { data: { user: null }, error: new Error("sem código") };

  if (error || !data.user) return NextResponse.redirect(`${origin}/entrar?erro=link`);

  if (!(await vincularAluno(data.user))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/entrar?erro=fora`);
  }
  return NextResponse.redirect(`${origin}/inicio`);
}
