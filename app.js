"use strict";
/* Sistema posicional de escalas
   Lógica + interface. O mesmo arquivo roda no navegador (index.html)
   e no Node (tests.js) — a parte de DOM só é ativada se `document` existir. */

/* ===================== Configuração ===================== */

const AFINACAO_PADRAO = ["E2", "A2", "D3", "G3", "B3", "E4"]; // índice 0 = 6ª corda (mais grave)
const JANELA_CASAS = [0, 15];

/* ===================== Dados: escalas ===================== */
/* Cada escala é um array de intervalos em semitons (soma = 12).
   Os códigos NUNCA são armazenados como strings — são gerados na exibição. */

const ESCALAS = {
  "Modos gregos": {
    "Jônio (maior)":         [2,2,1,2,2,2,1],
    "Dórico":                [2,1,2,2,2,1,2],
    "Frígio":                [1,2,2,2,1,2,2],
    "Lídio":                 [2,2,2,1,2,2,1],
    "Mixolídio":             [2,2,1,2,2,1,2],
    "Eólio (menor natural)": [2,1,2,2,1,2,2],
    "Lócrio":                [1,2,2,1,2,2,2]
  },
  "Modos da menor melódica": {
    "Menor melódica":        [2,1,2,2,2,2,1],
    "Dórico b2":             [1,2,2,2,2,1,2],
    "Lídio #5":              [2,2,2,2,1,2,1],
    "Lídio b7":              [2,2,2,1,2,1,2],
    "Mixolídio b13":         [2,2,1,2,1,2,2],
    "Lócrio #2":             [2,1,2,1,2,2,2],
    "Superlócrio (alterado)":[1,2,1,2,2,2,2]
  },
  "Modos da menor harmônica": {
    "Menor harmônica":       [2,1,2,2,1,3,1],
    "Lócrio #6":             [1,2,2,1,3,1,2],
    "Jônio #5":              [2,2,1,3,1,2,1],
    "Dórico #4":             [2,1,3,1,2,1,2],
    "Frígio maior":          [1,3,1,2,1,2,2],
    "Lídio #2":              [3,1,2,1,2,2,1],
    "Superlócrio bb7":       [1,2,1,2,2,1,3]
  },
  "Simétricas": {
    "Tons inteiros":          [2,2,2,2,2,2],
    "Diminuta (tom–semitom)": [2,1,2,1,2,1,2,1],
    "Diminuta (semitom–tom)": [1,2,1,2,1,2,1,2]
  }
};

/* Os doze tons. `nomes` lista as grafias candidatas da tônica,
   na ordem de preferência em caso de empate de acidentes. */
const TONS = [
  { pc: 0,  label: "C",     nomes: ["C"] },
  { pc: 1,  label: "C#/Db", nomes: ["C#", "Db"] },
  { pc: 2,  label: "D",     nomes: ["D"] },
  { pc: 3,  label: "D#/Eb", nomes: ["Eb", "D#"] },
  { pc: 4,  label: "E",     nomes: ["E"] },
  { pc: 5,  label: "F",     nomes: ["F"] },
  { pc: 6,  label: "F#/Gb", nomes: ["F#", "Gb"] },
  { pc: 7,  label: "G",     nomes: ["G"] },
  { pc: 8,  label: "G#/Ab", nomes: ["Ab", "G#"] },
  { pc: 9,  label: "A",     nomes: ["A"] },
  { pc: 10, label: "A#/Bb", nomes: ["Bb", "A#"] },
  { pc: 11, label: "B",     nomes: ["B"] }
];

/* ===================== Notas e alturas ===================== */

const LETRAS = ["C", "D", "E", "F", "G", "A", "B"];
const PC_LETRA = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const TABELA_SUSTENIDOS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const TABELA_BEMOIS     = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

function mod12(n) { return ((n % 12) + 12) % 12; }

/* "E2", "C#4", "Bb3" → número MIDI */
function parseNota(nome) {
  const m = /^([A-G])(##|#|bb|b)?(-?\d+)$/.exec(nome);
  if (!m) throw new Error("Nota inválida: " + nome);
  const alt = m[2] ? (m[2][0] === "#" ? m[2].length : -m[2].length) : 0;
  return (parseInt(m[3], 10) + 1) * 12 + PC_LETRA[m[1]] + alt;
}

/* "Eb" → { letra, alt, pc } */
function parseNome(nome) {
  const m = /^([A-G])(##|#|bb|b)?$/.exec(nome);
  if (!m) return null;
  const alt = m[2] ? (m[2][0] === "#" ? m[2].length : -m[2].length) : 0;
  return { letra: m[1], alt, pc: mod12(PC_LETRA[m[1]] + alt) };
}

function altParaTexto(alt) {
  return { "-2": "bb", "-1": "b", "0": "", "1": "#", "2": "##" }[String(alt)];
}

/* Grafia com letras distintas (escalas de 7 notas).
   Devolve { nomes, custo } ou null se exigir acidente além do dobrado. */
function soletrar7(tonica, intervalos) {
  const t = parseNome(tonica);
  if (!t) return null;
  const li = LETRAS.indexOf(t.letra);
  const nomes = [];
  let custo = 0, acumulado = 0;
  for (let i = 0; i < 7; i++) {
    const letra = LETRAS[(li + i) % 7];
    const alvo = mod12(t.pc + acumulado);
    let alt = alvo - PC_LETRA[letra];
    if (alt > 6) alt -= 12;
    if (alt < -6) alt += 12;
    if (Math.abs(alt) > 2) return null;
    custo += Math.abs(alt);
    nomes.push(letra + altParaTexto(alt));
    acumulado += intervalos[i];
  }
  return { nomes, custo };
}

/* Nomes das notas da escala, incluindo a repetição da tônica na oitava
   (comprimento = nº de notas + 1). */
function gerarNomesNotas(intervalos, tom) {
  const n = intervalos.length;
  if (n === 7) {
    let melhor = null;
    for (const candidata of tom.nomes) {
      const r = soletrar7(candidata, intervalos);
      if (r && (!melhor || r.custo < melhor.custo)) melhor = r;
    }
    if (melhor) {
      melhor.nomes.push(melhor.nomes[0]);
      return melhor.nomes;
    }
  }
  /* Simétricas (6 ou 8 notas) e casos-limite: grafia mais legível,
     sem forçar letras distintas. Sustenidos para tons inteiros,
     bemóis para as diminutas. */
  const tabela = n === 8 ? TABELA_BEMOIS : TABELA_SUSTENIDOS;
  const nomes = [];
  let acumulado = 0;
  for (let i = 0; i < n; i++) {
    nomes.push(tabela[mod12(tom.pc + acumulado)]);
    acumulado += intervalos[i];
  }
  nomes.push(nomes[0]);
  return nomes;
}

/* ===================== Codificação posicional ===================== */

const CODIGO_INTERVALO = { 1: "0", 2: "1", 3: "10" };

/* Regra do hífen: se o grupo contém um tom e meio (3 semitons),
   os dois códigos são separados por hífen (G0-10); senão, concatenados (C10). */
function gerarCodigo(nomeNota, i1, i2) {
  const separador = (i1 === 3 || i2 === 3) ? "-" : "";
  return nomeNota + CODIGO_INTERVALO[i1] + separador + CODIGO_INTERVALO[i2];
}

/* Grupos de três notas sobrepostos: nº de grupos = floor(nº de intervalos / 2). */
function gerarGrupos(intervalos, nomes) {
  const grupos = [];
  const quantos = Math.floor(intervalos.length / 2);
  for (let g = 0; g < quantos; g++) {
    const i1 = intervalos[2 * g];
    const i2 = intervalos[2 * g + 1];
    grupos.push({
      indiceNota: 2 * g,
      nome: nomes[2 * g],
      i1, i2,
      codigo: gerarCodigo(nomes[2 * g], i1, i2)
    });
  }
  return grupos;
}

function gerarCodigos(intervalos, tom) {
  return gerarGrupos(intervalos, gerarNomesNotas(intervalos, tom)).map(g => g.codigo);
}

/* ===================== Digitação ===================== */
/* desenho d: notas na corda inicial = 4 − d.
   1 → 3+0 · 2 → 2+1 · 3 → 1+2. A corda seguinte é a imediatamente mais aguda.
   A distância entre cordas vem da afinação, nunca de um if hardcoded. */

function calcularDigitacao({ pcInicial, i1, i2, afinacao = AFINACAO_PADRAO, cordaInicial, desenho, janela = JANELA_CASAS }) {
  const [casaMin, casaMax] = janela;
  const idxInicial = 6 - cordaInicial;      // afinacao[0] = 6ª corda
  const nasInicial = 4 - desenho;           // quantas notas na corda inicial
  const precisaSeguinte = desenho !== 1;

  if (precisaSeguinte && idxInicial + 1 >= afinacao.length) {
    return { valida: false, motivo: "não há corda seguinte — na corda " + cordaInicial + " só o desenho 1 é possível" };
  }

  const abertaInicial = parseNota(afinacao[idxInicial]);
  const abertaSeguinte = precisaSeguinte ? parseNota(afinacao[idxInicial + 1]) : null;
  const relativos = [0, i1, i1 + i2];

  /* A amplitude não depende da oitava escolhida — dá para validar antes. */
  const casasRel = relativos.map((r, k) =>
    r - (k < nasInicial ? 0 : abertaSeguinte - abertaInicial));
  const amplitude = Math.max(...casasRel) - Math.min(...casasRel);
  if (amplitude >= 6) {
    return { valida: false, motivo: "estiramento excessivo (amplitude de " + amplitude + " casas)", amplitude };
  }

  /* Escolhe a oitava mais grave em que todas as casas caem na janela. */
  const primeira = abertaInicial + mod12(pcInicial - abertaInicial);
  for (let base = primeira; base - abertaInicial <= casaMax; base += 12) {
    const notas = relativos.map((r, k) => {
      const naInicial = k < nasInicial;
      return {
        corda: naInicial ? cordaInicial : cordaInicial - 1,
        casa: base + r - (naInicial ? abertaInicial : abertaSeguinte),
        pitch: base + r
      };
    });
    if (notas.every(nt => nt.casa >= casaMin && nt.casa <= casaMax)) {
      return { valida: true, notas, amplitude, aceitavel: amplitude === 5 };
    }
  }
  return { valida: false, motivo: "fora do braço (casas " + casaMin + "–" + casaMax + ")", amplitude };
}

/* ===================== Exportação para Node (testes) ===================== */

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AFINACAO_PADRAO, JANELA_CASAS, ESCALAS, TONS,
    mod12, parseNota, parseNome,
    gerarNomesNotas, gerarCodigo, gerarGrupos, gerarCodigos,
    calcularDigitacao
  };
}

/* ===================== Interface (só no navegador) ===================== */

if (typeof document !== "undefined") {

  const SVG_NS = "http://www.w3.org/2000/svg";
  const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const ROTULO_INTERVALO = { 1: "st", 2: "T", 3: "T+st" };
  const CORDAS = [6, 5, 4, 3, 2, 1];
  const TOOLTIP_FAMILIAS =
    "A forma da corda 6 se repete nas cordas 5, 4 e 2; só a corda 3 é diferente, por causa da corda Si.";

  function tooltipCorda(corda) {
    if (corda === 1) return "Corda mais aguda: não há corda seguinte — só o desenho 1 é possível.";
    const idx = 6 - corda;
    const dist = parseNota(AFINACAO_PADRAO[idx + 1]) - parseNota(AFINACAO_PADRAO[idx]);
    const nome = dist === 5 ? "quarta justa" : dist === 4 ? "terça maior" : dist + " semitons";
    return `Travessia de ${nome} até a corda ${corda - 1}. ${TOOLTIP_FAMILIAS}`;
  }
  const TOOLTIP_DESENHO = {
    1: "Três notas na corda inicial",
    2: "Duas notas na corda inicial, uma na seguinte",
    3: "Uma nota na corda inicial, duas na seguinte"
  };

  const state = {
    familia: "Modos gregos",
    escala: "Jônio (maior)",
    tomIdx: 0,
    selecoes: [],   // por grupo: { corda, desenho, aviso }
    destaque: null
  };

  /* ---------- Modelo derivado do estado ---------- */

  function calcularModelo() {
    const intervalos = ESCALAS[state.familia][state.escala];
    const tom = TONS[state.tomIdx];
    const nomes = gerarNomesNotas(intervalos, tom);
    const grupos = gerarGrupos(intervalos, nomes);
    const pcs = [];
    let acumulado = 0;
    for (let i = 0; i <= intervalos.length; i++) {
      pcs.push(mod12(tom.pc + acumulado));
      acumulado += intervalos[i] || 0;
    }
    return { intervalos, tom, nomes, grupos, pcs, escalaPcs: new Set(pcs) };
  }

  /* Papel de cada grau na escala → classe de cor.
     Tônica = teal; alcançada por tom = roxo; por semitom = coral;
     por tom e meio = coral forte com contorno duplo. */
  function tipoDoGrau(j, intervalos) {
    if (j === 0 || j === intervalos.length) return "tonica";
    return { 1: "semitom", 2: "tom", 3: "tomemeio" }[intervalos[j - 1]];
  }

  /* ---------- SVG: braço de guitarra ---------- */

  function svgEl(tag, attrs, texto) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (texto != null) el.textContent = texto;
    return el;
  }

  /* Função pura: gera o SVGElement do diagrama a partir dos dados. */
  function desenharBraco({ notas, afinacao, janelaCasas, codigo, nomesGrupo, tiposGrupo, escalaPcs, aceitavel }) {
    const casas = notas.map(nt => nt.casa);
    let ini = Math.max(0, Math.min(...casas) - 1);
    let fim = Math.max(ini + 5, Math.max(...casas) + 1);
    if (fim > janelaCasas[1]) {
      fim = janelaCasas[1];
      ini = Math.max(0, Math.min(ini, fim - 5));
    }
    const nCasas = fim - ini + 1;

    const celW = 46, linhaH = 26, esq = 40, topo = 16;
    const largBraco = nCasas * celW;
    const largura = esq + largBraco + 12;
    const altura = topo + 5 * linhaH + 34;
    const yCorda = c => topo + (c - 1) * linhaH;               // corda 1 no topo
    const xCentro = c => esq + (c - ini) * celW + celW / 2;
    const xDireita = c => esq + (c - ini + 1) * celW;

    const svg = svgEl("svg", {
      viewBox: `0 0 ${largura} ${altura}`,
      class: "braco" + (aceitavel ? " aceitavel" : ""),
      role: "img"
    });
    const descTexto = notas.map((nt, k) =>
      `${nomesGrupo[k]} na casa ${nt.casa} da corda ${nt.corda}`).join(", ");
    svg.appendChild(svgEl("title", {}, codigo));
    svg.appendChild(svgEl("desc", {}, `${codigo} — ${descTexto}.`));
    svg.setAttribute("aria-label", `${codigo}: ${descTexto}`);

    if (aceitavel) {
      svg.appendChild(svgEl("rect", {
        x: 1, y: 1, width: largura - 2, height: altura - 2, rx: 8,
        class: "quadro-aceitavel"
      }));
    }

    /* Trastes (linhas verticais). A pestana (entre a casa 0 e a 1) é mais grossa. */
    if (ini > 0) {
      svg.appendChild(svgEl("line", { x1: esq, y1: yCorda(1), x2: esq, y2: yCorda(6), class: "traste" }));
    }
    for (let c = ini; c <= fim; c++) {
      svg.appendChild(svgEl("line", {
        x1: xDireita(c), y1: yCorda(1), x2: xDireita(c), y2: yCorda(6),
        class: c === 0 ? "pestana" : "traste"
      }));
    }

    /* Marcadores de posição (casas 3, 5, 7, 9, 12, 15). */
    for (let c = Math.max(ini, 1); c <= fim; c++) {
      if ([3, 5, 7, 9, 15].includes(c)) {
        svg.appendChild(svgEl("circle", { cx: xCentro(c), cy: topo + 2.5 * linhaH, r: 3.5, class: "marcador" }));
      } else if (c === 12) {
        svg.appendChild(svgEl("circle", { cx: xCentro(c), cy: topo + 1.5 * linhaH, r: 3.5, class: "marcador" }));
        svg.appendChild(svgEl("circle", { cx: xCentro(c), cy: topo + 3.5 * linhaH, r: 3.5, class: "marcador" }));
      }
    }

    /* Cordas (linhas horizontais) e nomes das cordas à esquerda. */
    for (let corda = 1; corda <= 6; corda++) {
      const y = yCorda(corda);
      svg.appendChild(svgEl("line", { x1: esq, y1: y, x2: esq + largBraco, y2: y, class: "corda" }));
      svg.appendChild(svgEl("text", {
        x: esq - 8, y: y + 3.5, "text-anchor": "end", class: "rotulo-corda"
      }, afinacao[6 - corda].replace(/-?\d+$/, "")));
    }

    /* Números das casas embaixo. */
    for (let c = ini; c <= fim; c++) {
      svg.appendChild(svgEl("text", {
        x: xCentro(c), y: altura - 10, "text-anchor": "middle",
        class: "num-casa" + (c === 12 ? " num-casa-12" : "")
      }, String(c)));
    }

    /* Notas da escala na janela que não pertencem ao grupo: contexto. */
    const ocupadas = new Set(notas.map(nt => nt.corda + ":" + nt.casa));
    for (let corda = 1; corda <= 6; corda++) {
      const aberta = parseNota(afinacao[6 - corda]);
      for (let c = ini; c <= fim; c++) {
        if (escalaPcs.has(mod12(aberta + c)) && !ocupadas.has(corda + ":" + c)) {
          svg.appendChild(svgEl("circle", {
            cx: xCentro(c), cy: yCorda(corda), r: 5, class: "nota-contexto"
          }));
        }
      }
    }

    /* As três notas do grupo. */
    notas.forEach((nt, k) => {
      const cx = xCentro(nt.casa), cy = yCorda(nt.corda);
      const tipo = tiposGrupo[k];
      if (tipo === "tomemeio") {
        svg.appendChild(svgEl("circle", { cx, cy, r: 14.5, class: "anel-tomemeio" }));
      }
      svg.appendChild(svgEl("circle", { cx, cy, r: 11, class: "nota-grupo nota-" + tipo }));
      svg.appendChild(svgEl("text", {
        x: cx, y: cy + 3.2, "text-anchor": "middle",
        class: "nome-nota" + (nomesGrupo[k].length > 2 ? " nome-nota-longo" : "")
      }, nomesGrupo[k]));
    });

    return svg;
  }

  /* ---------- Renderização da página ---------- */

  function formatarCodigoHTML(grupo) {
    const parte = s => s === 3
      ? `<span class="cod cod-tomemeio">10</span>`
      : `<span class="cod">${CODIGO_INTERVALO[s]}</span>`;
    const hifen = (grupo.i1 === 3 || grupo.i2 === 3) ? `<span class="cod-hifen">-</span>` : "";
    return `<span class="cod-nome">${grupo.nome}</span>${parte(grupo.i1)}${hifen}${parte(grupo.i2)}`;
  }

  function renderGraus(modelo) {
    const cont = document.getElementById("graus");
    const n = modelo.intervalos.length;
    const g = state.destaque;
    const emDestaque = i => g != null && i >= modelo.grupos[g].indiceNota && i <= modelo.grupos[g].indiceNota + 2;
    let html = "";
    for (let i = 0; i <= n; i++) {
      html += `<div class="grau${emDestaque(i) ? " grau-destaque" : ""}">
        <span class="romano">${i === n ? "(I)" : ROMANOS[i]}</span>
        <span class="nota">${modelo.nomes[i]}</span>
      </div>`;
      if (i < n) {
        const dentro = g != null && i >= modelo.grupos[g].indiceNota && i < modelo.grupos[g].indiceNota + 2;
        html += `<span class="intervalo${dentro ? " grau-destaque" : ""}">${ROTULO_INTERVALO[modelo.intervalos[i]]}</span>`;
      }
    }
    cont.innerHTML = html;
  }

  function renderCodigos(modelo) {
    const cont = document.getElementById("codigos");
    cont.innerHTML = modelo.grupos.map((grupo, i) =>
      `<button type="button" class="codigo${state.destaque === i ? " ativo" : ""}"
        data-grupo="${i}" aria-pressed="${state.destaque === i}"
        title="Destacar o grupo ${grupo.codigo}">${formatarCodigoHTML(grupo)}</button>`
    ).join("");
  }

  function renderColunas(modelo) {
    const cont = document.getElementById("colunas");
    cont.innerHTML = "";
    cont.style.setProperty("--n-colunas", modelo.grupos.length);

    modelo.grupos.forEach((grupo, gi) => {
      if (!state.selecoes[gi]) state.selecoes[gi] = { corda: 6, desenho: 1, aviso: null };
      const sel = state.selecoes[gi];

      /* Validade das combinações corda × desenho. */
      const digitacoes = {};
      for (const corda of CORDAS) {
        for (let d = 1; d <= 3; d++) {
          digitacoes[corda + "-" + d] = calcularDigitacao({
            pcInicial: modelo.pcs[grupo.indiceNota],
            i1: grupo.i1, i2: grupo.i2,
            afinacao: AFINACAO_PADRAO,
            cordaInicial: corda, desenho: d
          });
        }
      }

      /* Se a combinação escolhida ficou inválida (troca de escala/tom),
         cai para a primeira válida — avisando, nunca em silêncio. */
      if (!digitacoes[sel.corda + "-" + sel.desenho].valida) {
        const anterior = `corda ${sel.corda}, desenho ${sel.desenho}`;
        const ordem = [];
        for (const c of [sel.corda, ...CORDAS.filter(c => c !== sel.corda)]) {
          for (let d = 1; d <= 3; d++) ordem.push([c, d]);
        }
        const alternativa = ordem.find(([c, d]) => digitacoes[c + "-" + d].valida);
        if (alternativa) {
          sel.aviso = `A combinação anterior (${anterior}) não está disponível neste grupo — mostrando corda ${alternativa[0]}, desenho ${alternativa[1]}.`;
          sel.corda = alternativa[0];
          sel.desenho = alternativa[1];
        }
      }

      const digAtual = digitacoes[sel.corda + "-" + sel.desenho];

      const col = document.createElement("div");
      col.className = "coluna" + (state.destaque === gi ? " coluna-destaque" : "");
      col.dataset.coluna = gi;

      const botoesDesenho = [1, 2, 3].map(d => {
        const dig = digitacoes[sel.corda + "-" + d];
        const invalido = !dig.valida;
        return `<button type="button" data-acao="desenho" data-grupo="${gi}" data-valor="${d}"
          class="opcao${sel.desenho === d ? " sel" : ""}${invalido ? " invalido" : ""}"
          aria-pressed="${sel.desenho === d}"${invalido ? ' aria-disabled="true"' : ""}
          title="${invalido ? dig.motivo : TOOLTIP_DESENHO[d]}">${d}</button>`;
      }).join("");

      const botoesCorda = CORDAS.map(c => {
        return `<button type="button" data-acao="corda" data-grupo="${gi}" data-valor="${c}"
          class="opcao${sel.corda === c ? " sel" : ""}"
          aria-pressed="${sel.corda === c}" title="${tooltipCorda(c)}">${c}</button>`;
      }).join("");

      col.innerHTML = `
        <div class="grupo-controles">
          <div class="seletor" role="group" aria-label="Corda inicial do grupo ${grupo.codigo}">
            <span class="seletor-rotulo">Corda</span>${botoesCorda}
          </div>
          <div class="seletor" role="group" aria-label="Desenho do grupo ${grupo.codigo}">
            <span class="seletor-rotulo">Desenho</span>${botoesDesenho}
          </div>
        </div>
        ${sel.aviso ? `<p class="aviso" role="status">${sel.aviso}</p>` : ""}
        <div class="diagrama"></div>
        <div class="legenda-codigo">${formatarCodigoHTML(grupo)}${digAtual.valida && digAtual.aceitavel
          ? '<span class="nota-amplitude">amplitude 5 — aceitável</span>' : ""}</div>`;

      const alvo = col.querySelector(".diagrama");
      if (digAtual.valida) {
        const nomesGrupo = [0, 1, 2].map(k => modelo.nomes[grupo.indiceNota + k]);
        const tiposGrupo = [0, 1, 2].map(k => tipoDoGrau(grupo.indiceNota + k, modelo.intervalos));
        alvo.appendChild(desenharBraco({
          notas: digAtual.notas,
          afinacao: AFINACAO_PADRAO,
          janelaCasas: JANELA_CASAS,
          codigo: grupo.codigo,
          nomesGrupo, tiposGrupo,
          escalaPcs: modelo.escalaPcs,
          aceitavel: digAtual.aceitavel
        }));
      } else {
        alvo.innerHTML = `<p class="sem-diagrama">Nenhuma digitação válida nesta combinação: ${digAtual.motivo}.</p>`;
      }

      cont.appendChild(col);
    });
  }

  function render() {
    const modelo = calcularModelo();
    if (state.destaque != null && state.destaque >= modelo.grupos.length) state.destaque = null;
    state.selecoes.length = modelo.grupos.length;
    renderGraus(modelo);
    renderCodigos(modelo);
    renderColunas(modelo);
  }

  /* ---------- Controles ---------- */

  function init() {
    const selEscala = document.getElementById("sel-escala");
    for (const familia in ESCALAS) {
      const og = document.createElement("optgroup");
      og.label = familia;
      for (const nome in ESCALAS[familia]) {
        const opt = document.createElement("option");
        opt.value = familia + "||" + nome;
        opt.textContent = nome;
        og.appendChild(opt);
      }
      selEscala.appendChild(og);
    }
    selEscala.value = state.familia + "||" + state.escala;
    selEscala.addEventListener("change", () => {
      [state.familia, state.escala] = selEscala.value.split("||");
      state.selecoes.forEach(s => { if (s) s.aviso = null; });
      render();
    });

    const selTom = document.getElementById("sel-tom");
    TONS.forEach((tom, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = tom.label;
      selTom.appendChild(opt);
    });
    selTom.value = "0";
    selTom.addEventListener("change", () => {
      state.tomIdx = parseInt(selTom.value, 10);
      state.selecoes.forEach(s => { if (s) s.aviso = null; });
      render();
    });

    document.getElementById("codigos").addEventListener("click", e => {
      const btn = e.target.closest("button.codigo");
      if (!btn) return;
      const g = parseInt(btn.dataset.grupo, 10);
      state.destaque = state.destaque === g ? null : g;
      render();
    });

    document.getElementById("colunas").addEventListener("click", e => {
      const btn = e.target.closest("button[data-acao]");
      if (!btn || btn.getAttribute("aria-disabled") === "true") return;
      const sel = state.selecoes[parseInt(btn.dataset.grupo, 10)];
      sel.aviso = null;
      sel[btn.dataset.acao] = parseInt(btn.dataset.valor, 10);
      render();
    });

    /* Tema: Auto (segue o sistema) → Claro → Escuro, persistido. */
    const btnTema = document.getElementById("btn-tema");
    const ROTULO_TEMA = { "": "Auto", claro: "Claro", escuro: "Escuro" };
    const aplicarTema = tema => {
      if (tema) document.documentElement.dataset.tema = tema;
      else delete document.documentElement.dataset.tema;
      btnTema.textContent = "Tema: " + ROTULO_TEMA[tema];
    };
    let tema = "";
    try { tema = localStorage.getItem("tema") || ""; } catch (e) {}
    if (!(tema in ROTULO_TEMA)) tema = "";
    aplicarTema(tema);
    btnTema.addEventListener("click", () => {
      tema = { "": "claro", claro: "escuro", escuro: "" }[tema];
      try {
        if (tema) localStorage.setItem("tema", tema);
        else localStorage.removeItem("tema");
      } catch (e) {}
      aplicarTema(tema);
    });

    const btnLerMais = document.getElementById("ler-mais");
    btnLerMais.addEventListener("click", () => {
      const aberto = document.querySelector(".intro").classList.toggle("intro-aberta");
      btnLerMais.setAttribute("aria-expanded", String(aberto));
      btnLerMais.textContent = aberto ? "Ler menos" : "Ler mais";
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
