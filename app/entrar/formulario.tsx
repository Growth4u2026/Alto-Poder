"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { confirmarCodigo, pedirAcesso } from "./acoes";

// Login sem senha: e-mail + código (enviado pelo Resend, modelo de e-mail com {{ .Token }}).
// O link do e-mail, se existir, continua funcionando pela rota /auth/retorno.

const AVISOS_DA_URL: Record<string, string> = {
  fora: "Oi! Esse acesso é exclusivo para alunos da Growth4u e participantes do ALTO PODER. Se você já é, fala com o time da Growth4u.",
  link: "Esse link não funcionou ou já venceu. Pede um novo aqui embaixo?",
};

const campo =
  "mt-1 w-full rounded-xl border border-borda bg-fundo px-4 py-3 text-base outline-none focus:border-marca focus:ring-2 focus:ring-marca/30";
const botao =
  "w-full rounded-xl bg-marca px-4 py-3 font-medium text-white transition hover:bg-marca-forte disabled:opacity-60";

export default function FormularioEntrar() {
  const erroDaUrl = useSearchParams().get("erro");
  const [etapa, setEtapa] = useState<"email" | "enviado">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState(erroDaUrl ? (AVISOS_DA_URL[erroDaUrl] ?? "") : "");
  const [enviando, iniciar] = useTransition();

  function enviarEmail(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    iniciar(async () => {
      const r = await pedirAcesso(email);
      if (r.ok) setEtapa("enviado");
      else setAviso(r.aviso);
    });
  }

  function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    iniciar(async () => {
      const r = await confirmarCodigo(email, codigo);
      if (r && !r.ok) setAviso(r.aviso);
    });
  }

  return (
    <>
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
              className={campo}
            />
          </label>
          <button type="submit" disabled={enviando} className={botao}>
            {enviando ? "Enviando…" : "Entrar"}
          </button>
          <p className="text-center text-xs text-suave">Sem senha: a gente te manda um código de acesso por e-mail.</p>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">
            Prontinho! Mandei um código para <strong>{email}</strong>. Confere a caixa de entrada (e o spam também, tá?).
          </p>

          <form onSubmit={enviarCodigo} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Código</span>
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                maxLength={8}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className={`${campo} text-center text-2xl tracking-[0.4em]`}
              />
            </label>
            <button type="submit" disabled={enviando} className={botao}>
              {enviando ? "Conferindo…" : "Entrar"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setEtapa("email"); setCodigo(""); setAviso(""); }}
            className="w-full text-sm text-marca hover:underline"
          >
            Usar outro e-mail
          </button>
        </div>
      )}

      {aviso && (
        <p role="status" className="mt-4 rounded-xl bg-marca-clara px-4 py-3 text-sm">
          {aviso}
        </p>
      )}
    </>
  );
}
