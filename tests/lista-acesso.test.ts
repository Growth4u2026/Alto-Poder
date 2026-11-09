import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularAcessoAte, lerCsv, lerPlano, validarAluno } from "../lib/lista-acesso.ts";

const HOJE = "2026-11-09";

test("programa tem 12 meses de acesso; ALTO PODER e admin não expiram", () => {
  assert.equal(calcularAcessoAte("start", "2026-03-25"), "2027-03-25");
  assert.equal(calcularAcessoAte("master", "2026-01-01"), "2027-01-01");
  assert.equal(calcularAcessoAte("alto_poder", "2026-03-25"), null);
  assert.equal(calcularAcessoAte("admin", "2026-03-25"), null);
});

test("entende o plano escrito de vários jeitos", () => {
  assert.equal(lerPlano("Growth Start"), "start");
  assert.equal(lerPlano("MASTER"), "master");
  assert.equal(lerPlano("Alto Poder"), "alto_poder");
  assert.equal(lerPlano(""), "alto_poder");
  assert.equal(lerPlano("vip"), null);
});

test("valida e-mail e normaliza", () => {
  const r = validarAluno({ nome: " Bia ", email: " BIA@Email.com ", plano: "start", data_entrada: "25/03/2026", whatsapp: "(11) 98888-7777" }, HOJE);
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.aluno, { nome: "Bia", email: "bia@email.com", whatsapp: "11988887777", plano: "start", data_entrada: "2026-03-25", acesso_ate: "2027-03-25" });
  assert.equal(validarAluno({ nome: "X", email: "sem-arroba", plano: "" }, HOJE).ok, false);
});

test("lê CSV do Excel (ponto e vírgula) com cabeçalho e aponta erros por linha", () => {
  const csv = "﻿Nome;E-mail;Plano;Data de entrada\r\nAna;ana@x.com;Growth Master;01/02/2026\r\nBia;bia@x.com;;\r\nCris;cris-invalido;start;\r\nAna 2;ANA@x.com;start;\r\n";
  const { alunos, erros } = lerCsv(csv, HOJE);
  assert.equal(alunos.length, 2);
  assert.equal(alunos[0].plano, "master");
  assert.equal(alunos[0].data_entrada, "2026-02-01");
  assert.equal(alunos[0].acesso_ate, "2027-02-01");
  assert.equal(alunos[1].plano, "alto_poder");
  assert.equal(alunos[1].data_entrada, HOJE);
  assert.equal(erros.length, 2);
  assert.match(erros[0], /Linha 4/);
  assert.match(erros[1], /repetido/);
});

test("CSV com vírgula também funciona", () => {
  const { alunos } = lerCsv("nome,email\nDani,dani@x.com", HOJE);
  assert.equal(alunos[0].email, "dani@x.com");
});
