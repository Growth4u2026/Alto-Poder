import { Fragment } from "react";

/** Mostra um texto da Alta: *negrito*, quebras de linha e parágrafos. */
export default function TextoAlta({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/\n{2,}/).map((paragrafo, i) => (
        <p key={i} className={i > 0 ? "mt-3" : undefined}>
          {paragrafo.split("\n").map((linha, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {linha.split(/(\*[^*]+\*)/g).map((parte, k) =>
                parte.startsWith("*") && parte.endsWith("*") && parte.length > 2 ? (
                  <strong key={k}>{parte.slice(1, -1)}</strong>
                ) : (
                  <Fragment key={k}>{parte}</Fragment>
                ),
              )}
            </Fragment>
          ))}
        </p>
      ))}
    </>
  );
}
