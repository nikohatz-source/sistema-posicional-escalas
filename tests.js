"use strict";
/* Testes do sistema posicional de escalas.
   Rodar com: node tests.js */

const A = require("./app.js");

let total = 0, falhas = 0;

function teste(nome, obtido, esperado) {
  total++;
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) {
    falhas++;
    console.error(`✗ ${nome}\n    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
  } else {
    console.log(`✓ ${nome}`);
  }
}

const tom = label => A.TONS.find(t => t.label === label);
const codigos = (familia, escala, tomLabel) =>
  A.gerarCodigos(A.ESCALAS[familia][escala], tom(tomLabel));

/* ============ Os cinco casos de aceite ============ */

teste("Jônio (maior) em C → C11 E01 G11",
  codigos("Modos gregos", "Jônio (maior)", "C"), ["C11", "E01", "G11"]);

teste("Menor harmônica em C → C10 Eb11 G0-10",
  codigos("Modos da menor harmônica", "Menor harmônica", "C"), ["C10", "Eb11", "G0-10"]);

teste("Frígio maior em G começa em G0-10",
  codigos("Modos da menor harmônica", "Frígio maior", "G")[0], "G0-10");

teste("Tons inteiros em C → C11 E11 G#11",
  codigos("Simétricas", "Tons inteiros", "C"), ["C11", "E11", "G#11"]);

teste("Diminuta (tom–semitom) em C → C10 Eb10 Gb10 A10 (4 grupos)",
  codigos("Simétricas", "Diminuta (tom–semitom)", "C"), ["C10", "Eb10", "Gb10", "A10"]);

/* ============ Estrutura ============ */

const semNome = c => c.replace(/^[A-G](##|#|bb|b)?/, "");

teste("Trocar o tom preserva a estrutura dos códigos (Jônio C vs D)",
  codigos("Modos gregos", "Jônio (maior)", "D").map(semNome),
  codigos("Modos gregos", "Jônio (maior)", "C").map(semNome));

teste("Trocar o tom preserva a estrutura (Menor harmônica C vs E)",
  codigos("Modos da menor harmônica", "Menor harmônica", "E").map(semNome),
  codigos("Modos da menor harmônica", "Menor harmônica", "C").map(semNome));

teste("Nº de grupos: 7 notas → 3", codigos("Modos gregos", "Dórico", "C").length, 3);
teste("Nº de grupos: 6 notas → 3", codigos("Simétricas", "Tons inteiros", "C").length, 3);
teste("Nº de grupos: 8 notas → 4", codigos("Simétricas", "Diminuta (semitom–tom)", "C").length, 4);

teste("Linha de graus: 7 notas → 8 nomes (com a oitava)",
  A.gerarNomesNotas(A.ESCALAS["Modos gregos"]["Lídio"], tom("C")).length, 8);
teste("Linha de graus: 6 notas → 7 nomes",
  A.gerarNomesNotas(A.ESCALAS["Simétricas"]["Tons inteiros"], tom("C")).length, 7);
teste("Linha de graus: 8 notas → 9 nomes",
  A.gerarNomesNotas(A.ESCALAS["Simétricas"]["Diminuta (tom–semitom)"], tom("C")).length, 9);

/* ============ Grafia enarmônica ============ */

teste("Menor harmônica em C: C D Eb F G Ab B",
  A.gerarNomesNotas(A.ESCALAS["Modos da menor harmônica"]["Menor harmônica"], tom("C")).slice(0, 7),
  ["C", "D", "Eb", "F", "G", "Ab", "B"]);

teste("Jônio em C#/Db escolhe Db (menos acidentes)",
  A.gerarNomesNotas(A.ESCALAS["Modos gregos"]["Jônio (maior)"], tom("C#/Db")).slice(0, 7),
  ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"]);

teste("Superlócrio bb7 em C usa dobrado-bemol no 7º grau",
  A.gerarNomesNotas(A.ESCALAS["Modos da menor harmônica"]["Superlócrio bb7"], tom("C")).slice(0, 7),
  ["C", "Db", "Eb", "Fb", "Gb", "Ab", "Bbb"]);

/* ============ Digitação: casos numéricos do grupo C11 ============ */

const digC11 = (corda, desenho) => A.calcularDigitacao({
  pcInicial: 0, i1: 2, i2: 2, cordaInicial: corda, desenho
});
const casas = dig => dig.notas.map(nt => nt.casa);
const cordas = dig => dig.notas.map(nt => nt.corda);
const perfil = dig => dig.notas.map(nt => nt.casa - dig.notas[0].casa);

teste("C11 corda 6, desenho 1 → casas 8, 10, 12", casas(digC11(6, 1)), [8, 10, 12]);
teste("C11 corda 3, desenho 1 → casas 5, 7, 9",   casas(digC11(3, 1)), [5, 7, 9]);
teste("C11 corda 6, desenho 2 → casas 8, 10, 7",  casas(digC11(6, 2)), [8, 10, 7]);
teste("C11 corda 3, desenho 2 → casas 5, 7, 5",   casas(digC11(3, 2)), [5, 7, 5]);

teste("Perfil desenho 1 idêntico nas cordas 6 e 3 (0,+2,+4)",
  [perfil(digC11(6, 1)), perfil(digC11(3, 1))], [[0, 2, 4], [0, 2, 4]]);

teste("C11 corda 5, desenho 2 → casas 3, 5, 2", casas(digC11(5, 2)), [3, 5, 2]);
teste("Perfil da corda 5 = perfil da corda 6 (desenho 2)",
  perfil(digC11(5, 2)), perfil(digC11(6, 2)));
teste("Perfil da corda 4 = perfil da corda 6 (desenho 2)",
  perfil(digC11(4, 2)), perfil(digC11(6, 2)));
teste("Perfil da corda 2 = perfil da corda 6 (desenho 2)",
  perfil(digC11(2, 2)), perfil(digC11(6, 2)));
teste("Perfis das cordas 6 e 3 diferem no desenho 2",
  JSON.stringify(perfil(digC11(6, 2))) !== JSON.stringify(perfil(digC11(3, 2))), true);

teste("Desenho 1: as três notas na mesma corda", cordas(digC11(6, 1)), [6, 6, 6]);
teste("Desenho 2: duas na inicial, uma na seguinte", cordas(digC11(6, 2)), [6, 6, 5]);
teste("Desenho 3: uma na inicial, duas na seguinte", cordas(digC11(6, 3)), [6, 5, 5]);

/* ============ Tocabilidade ============ */

teste("Amplitude 5 marcada como aceitável (grupo 10-1, C10 invertido: i1=3,i2=2 no desenho 1)",
  (() => { const d = A.calcularDigitacao({ pcInicial: 0, i1: 3, i2: 2, cordaInicial: 6, desenho: 1 });
    return d.valida && d.aceitavel === true && d.amplitude === 5; })(), true);

teste("Amplitude ≥ 6 é inválida com motivo de estiramento",
  (() => { const d = A.calcularDigitacao({ pcInicial: 0, i1: 3, i2: 3, cordaInicial: 6, desenho: 1 });
    return !d.valida && /estiramento/.test(d.motivo); })(), true);

/* ============ Corda 1: só o desenho 1 ============ */

teste("Corda 1, desenho 1 é válido (C11 → casas 8, 10, 12)",
  casas(digC11(1, 1)), [8, 10, 12]);
teste("Corda 1, desenho 1: as três notas na corda 1",
  cordas(digC11(1, 1)), [1, 1, 1]);
teste("Desenho 2 a partir da corda 1 é inválido (não há corda seguinte)",
  A.calcularDigitacao({ pcInicial: 0, i1: 2, i2: 2, cordaInicial: 1, desenho: 2 }).valida, false);
teste("Desenho 3 a partir da corda 1 é inválido (não há corda seguinte)",
  A.calcularDigitacao({ pcInicial: 0, i1: 2, i2: 2, cordaInicial: 1, desenho: 3 }).valida, false);

/* ============ Resultado ============ */

console.log(`\n${total - falhas}/${total} testes passaram.`);
process.exit(falhas ? 1 : 0);
