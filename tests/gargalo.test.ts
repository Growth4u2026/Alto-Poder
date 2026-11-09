import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularGargalo } from "../lib/alta/gargalo.ts";

// Monta as 18 notas a partir de 6 trios (um por pilar).
const notas = (...trios: [number, number, number][]) => trios.flat();

test("nota do pilar é a média com uma casa decimal", () => {
  const r = calcularGargalo(notas([10, 10, 9], [5, 5, 5], [0, 1, 1], [7, 7, 7], [8, 8, 8], [9, 9, 9]));
  assert.equal(r.notasPorPilar["1"], 9.7);
  assert.equal(r.notasPorPilar["3"], 0.7);
});

test("gargalo principal é a menor nota e o secundário a segunda menor", () => {
  const r = calcularGargalo(notas([8, 8, 8], [6, 6, 6], [9, 9, 9], [2, 2, 2], [7, 7, 7], [4, 4, 4]));
  assert.equal(r.gargalo1, 4);
  assert.equal(r.gargalo2, 6);
});

test("empate: vence o pilar que vem antes na jornada", () => {
  const r = calcularGargalo(notas([9, 9, 9], [3, 3, 3], [9, 9, 9], [9, 9, 9], [3, 3, 3], [3, 3, 3]));
  assert.equal(r.gargalo1, 2);
  assert.equal(r.gargalo2, 5);
});

test("todas iguais: pilares 1 e 2", () => {
  const r = calcularGargalo(Array(18).fill(5));
  assert.deepEqual([r.gargalo1, r.gargalo2], [1, 2]);
});

test("rejeita quantidade ou nota inválida", () => {
  assert.throws(() => calcularGargalo(Array(17).fill(5)));
  assert.throws(() => calcularGargalo([...Array(17).fill(5), 11]));
  assert.throws(() => calcularGargalo([...Array(17).fill(5), 2.5]));
});
