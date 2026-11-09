import { Suspense } from "react";
import FormularioEntrar from "./formulario";

export default function Entrar() {
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
          <Suspense>
            <FormularioEntrar />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-suave">
          Growth4u Academy · <a href="/privacidade" className="underline">Privacidade</a>
        </p>
      </div>
    </main>
  );
}
