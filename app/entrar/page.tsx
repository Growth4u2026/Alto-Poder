"use client";

import { useState } from "react";

// Tela de login sem senha: e-mail + código de 6 dígitos.
// Por enquanto é só a interface. O envio real do código entra na tarefa 0.3 (Supabase).

type Etapa = "email" | "codigo";

export default function Entrar() {
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState("");

  function enviarEmail(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    setEtapa("codigo");
  }

  function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setAviso("Login ainda em construção: a conexão com o banco entra na próxima etapa.");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={64} height={64} className="mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-semibold tracking-tight">Alta</h1>
          <p className="mt-2 text-suave">Sua sócia de negócios, sempre por perto 💜</p>
        </div>

        <div className="rounded-2xl border border-borda bg-cartao p-6 shadow-sm">
          {etapa === "email" ? (
            <form onSubmit={enviarEmail} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Seu e-mail</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="mt-1 w-full rounded-xl border border-borda bg-fundo px-4 py-3 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-marca px-4 py-3 font-medium text-white transition hover:bg-marca-forte"
              >
                Receber código
              </button>
              <p className="text-center text-xs text-suave">
                Sem senha: a gente te manda um código de 6 dígitos.
              </p>
            </form>
          ) : (
            <form onSubmit={enviarCodigo} className="space-y-4">
              <p className="text-sm">
                Mandei um código para <strong>{email}</strong>. Confere a caixa de entrada (e o spam, tá?).
              </p>
              <label className="block">
                <span className="text-sm font-medium">Código</span>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="mt-1 w-full rounded-xl border border-borda bg-fundo px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-marca px-4 py-3 font-medium text-white transition hover:bg-marca-forte"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setEtapa("email"); setCodigo(""); setAviso(""); }}
                className="w-full text-sm text-marca hover:underline"
              >
                Usar outro e-mail
              </button>
            </form>
          )}

          {aviso && (
            <p role="status" className="mt-4 rounded-xl bg-marca-clara px-4 py-3 text-sm">
              {aviso}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-suave">
          Growth4u Academy · <a href="/privacidade" className="underline">Privacidade</a>
        </p>
      </div>
    </main>
  );
}
