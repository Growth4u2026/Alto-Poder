import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Renova a sessão de login a cada visita e protege as áreas do aluno e do admin.
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Se o Supabase devolver o link para a raiz (/?code=...), encaminha para o retorno.
  if (pathname === "/" && (searchParams.has("code") || searchParams.has("token_hash"))) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/auth/retorno";
    return NextResponse.redirect(destino);
  }

  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const logado = !!data?.claims;
  const areaProtegida = /^\/(inicio|conteudo|ideia|duvida|perfil|admin)(\/|$)/.test(pathname);

  if ((areaProtegida || pathname === "/") && !logado) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = "";
    return NextResponse.redirect(destino);
  }
  if ((pathname === "/" || pathname === "/entrar") && logado && !searchParams.has("erro")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/inicio";
    destino.search = "";
    return NextResponse.redirect(destino);
  }
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|auth/).*)"],
};
