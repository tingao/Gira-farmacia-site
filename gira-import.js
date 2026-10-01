/* GIRA: importação de catálogo de produtos via planilha Excel (.xlsx / .xls).
 *
 * Tudo roda NO NAVEGADOR: o arquivo escolhido pelo usuário é lido com a
 * biblioteca SheetJS (vendor/xlsx.full.min.js) e convertido em registros de SKU
 * no mesmo formato de `gira-data.js`. Nada é enviado para nenhum servidor.
 *
 * Este módulo é puro (não toca no DOM), para poder ser testado no Node:
 *   importarCatalogo(XLSX, arrayBuffer) -> relatório
 *   catalogoParaWorkbook(XLSX, skus)    -> workbook (modelo / exportação)
 */

/* ------------------------------------------------------------------ *
 * Normalização de cabeçalhos
 * ------------------------------------------------------------------ */

/** "Múltiplo Caixa Fornecedor (UN)" -> "multiplo caixa fornecedor" */
export function normalizarHeader(valor) {
  if (valor === null || valor === undefined) return '';
  let s = String(valor);
  s = s.replace(/\([^)]*\)?/g, ' '); // remove "(R$)", "(UN)", "(fictício)", com ou sem fecha-parêntese
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, ' ').trim();
  return s.replace(/\s+/g, ' ');
}

/* Campos canônicos do catálogo. A ordem importa: o primeiro alias encontrado vence. */
export const CAMPOS = [
  { campo: 'sku',       rotulo: 'SKU_ID',                          aliases: ['sku id', 'sku', 'codigo do sku', 'cod sku', 'codigo'], obrigatorio: true },
  { campo: 'marca',     rotulo: 'Marca',                           aliases: ['marca', 'fabricante', 'laboratorio'] },
  { campo: 'produto',   rotulo: 'Produto',                         aliases: ['produto', 'nome do produto', 'descricao', 'nome'] },
  { campo: 'forma',     rotulo: 'Forma Farmacêutica',              aliases: ['forma farmaceutica', 'forma'] },
  { campo: 'embalagem', rotulo: 'Embalagem',                       aliases: ['embalagem', 'apresentacao'] },
  { campo: 'atc',       rotulo: 'Categoria ATC',                   aliases: ['categoria atc', 'classe atc', 'atc'] },
  { campo: 'ean',       rotulo: 'EAN',                             aliases: ['ean', 'codigo de barras', 'gtin'] },
  { campo: 'preco',     rotulo: 'Preço Médio (R$)',                aliases: ['preco medio', 'preco', 'valor'] },
  { campo: 'multiplo',  rotulo: 'Múltiplo Caixa Fornecedor (UN)',  aliases: ['multiplo caixa fornecedor', 'multiplo caixa', 'multiplo de caixa', 'multiplo'] },
  { campo: 'estoque',   rotulo: 'Estoque Atual (UN)',              aliases: ['estoque atual em maos', 'estoque atual', 'estoque em maos', 'estoque'] },
  { campo: 'pesoF1',    rotulo: 'Peso Base F1',                    aliases: ['peso base f1', 'peso f1'] },
  { campo: 'pesoF2',    rotulo: 'Peso Base F2',                    aliases: ['peso base f2', 'peso f2'] },
  { campo: 'pesoF3',    rotulo: 'Peso Base F3',                    aliases: ['peso base f3', 'peso f3'] },
  { campo: 'vendasF1',  rotulo: 'Vendas Farmácia 1 (UN/sem)',      aliases: ['vendas farmacia 1', 'farmacia 1'], prefixo: true },
  { campo: 'demandaTotal', rotulo: 'Total Brick (UN/sem)',         aliases: ['total brick', 'demanda brick'], prefixo: true },
  { campo: 'foto',      rotulo: 'Foto (URL ou img/AC001.jpg)',     aliases: ['foto', 'imagem', 'url da foto'] },
];

export const CAMPOS_OBRIGATORIOS = CAMPOS.filter((c) => c.obrigatorio).map((c) => c.campo);
export const CAMPOS_OPCIONAIS = CAMPOS.filter((c) => !c.obrigatorio).map((c) => c.rotulo);

/**
 * Mapeia um array de cabeçalhos normalizados para { campo: indiceDaColuna }.
 * Passo 1: igualdade exata (mais previsível). Passo 2: prefixo, só para os
 * campos marcados com `prefixo` (ex.: "vendas farmacia 1 hoje").
 */
export function resolverColunas(headersNormalizados) {
  const map = {};
  const usados = new Set();
  const achar = (fn) => {
    for (let i = 0; i < headersNormalizados.length; i++) {
      if (usados.has(i)) continue;
      if (fn(headersNormalizados[i])) return i;
    }
    return undefined;
  };

  for (const { campo, aliases } of CAMPOS) {
    const idx = achar((h) => h && aliases.includes(h));
    if (idx !== undefined) { map[campo] = idx; usados.add(idx); }
  }
  for (const { campo, aliases, prefixo } of CAMPOS) {
    if (!prefixo || map[campo] !== undefined) continue;
    const idx = achar((h) => h && aliases.some((a) => h.startsWith(a)));
    if (idx !== undefined) { map[campo] = idx; usados.add(idx); }
  }
  return map;
}

/** Procura a linha de cabeçalho (nas primeiras `maxLinhas`) que parece um catálogo. */
export function acharCabecalho(linhas, maxLinhas = 15) {
  const limite = Math.min(maxLinhas, linhas.length);
  for (let i = 0; i < limite; i++) {
    const linha = Array.isArray(linhas[i]) ? linhas[i] : [];
    const headers = linha.map(normalizarHeader);
    if (!headers.some(Boolean)) continue;
    const map = resolverColunas(headers);
    if (map.sku !== undefined && Object.keys(map).length >= 3) return { linhaIdx: i, map, headers };
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Coerção de valores
 * ------------------------------------------------------------------ */

/** Aceita 31.82, "31,82", "R$ 31,82", "1.234,56". Devolve null se não for número. */
export function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  let s = String(valor).trim();
  if (!s) return null;
  s = s.replace(/[^\d,.\-]/g, '');
  if (!s) return null;
  const temVirgula = s.includes(',');
  const temPonto = s.includes('.');
  if (temVirgula && temPonto) {
    // "1.234,56" (pt-BR) -> ponto é separador de milhar
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (temVirgula) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function inteiro(valor, padrao = 0) {
  const n = numero(valor);
  if (n === null) return padrao;
  return Math.max(0, Math.round(n));
}

export function texto(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

/* ------------------------------------------------------------------ *
 * Leitura do workbook
 * ------------------------------------------------------------------ */

function lerAbas(XLSX, arrayBuffer) {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  return wb.SheetNames.map((nome) => {
    const ws = wb.Sheets[nome];
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
    return { nome, nomeNorm: normalizarHeader(nome), linhas };
  });
}

function valorDaLinha(linha, map, campo) {
  const idx = map[campo];
  if (idx === undefined) return null;
  return linha[idx] ?? null;
}

const CAMPOS_SUPLEMENTARES = ['pesoF1', 'pesoF2', 'pesoF3', 'estoque', 'preco', 'multiplo', 'vendasF1', 'demandaTotal'];

/* ------------------------------------------------------------------ *
 * Importação
 * ------------------------------------------------------------------ */

/**
 * Converte um arquivo .xlsx/.xls no catálogo de SKUs do GIRA.
 * @returns {{ok:boolean, skus:Array, erros:string[], avisos:string[], assumicoes:string[],
 *            colunas:Object, abas:Array, lidos:number, ignorados:number}}
 */
export function importarCatalogo(XLSX, arrayBuffer) {
  const erros = [];
  const avisos = [];
  const assumicoes = [];

  let abas;
  try {
    abas = lerAbas(XLSX, arrayBuffer);
  } catch (e) {
    return { ok: false, skus: [], erros: [`Não consegui ler a planilha: ${e.message}`], avisos, assumicoes, colunas: {}, origens: {}, rotulosExternos: {}, abas: [], lidos: 0, ignorados: 0 };
  }
  if (!abas.length) {
    return { ok: false, skus: [], erros: ['A planilha não tem nenhuma aba legível.'], avisos, assumicoes, colunas: {}, origens: {}, rotulosExternos: {}, abas: [], lidos: 0, ignorados: 0 };
  }

  // 1) Encontra a aba principal do catálogo.
  const candidatas = abas
    .map((aba) => ({ aba, cab: acharCabecalho(aba.linhas) }))
    .filter((c) => c.cab);
  if (!candidatas.length) {
    return {
      ok: false, skus: [],
      erros: ['Formato não reconhecido: nenhuma aba tem uma linha de cabeçalho com a coluna "SKU_ID" (ou "SKU"/"Código").'],
      avisos, assumicoes, colunas: {}, origens: {}, rotulosExternos: {}, abas: abas.map((a) => a.nome), lidos: 0, ignorados: 0,
    };
  }
  candidatas.sort((a, b) => {
    const prefereA = a.aba.nomeNorm.includes('catalogo') ? 1 : 0;
    const prefereB = b.aba.nomeNorm.includes('catalogo') ? 1 : 0;
    if (prefereA !== prefereB) return prefereB - prefereA;
    return Object.keys(b.cab.map).length - Object.keys(a.cab.map).length;
  });
  const principal = candidatas[0];

  // 2) Dados complementares (peso/estoque) vindos de outras abas, por SKU.
  const suplementos = new Map();
  const origens = {};
  const rotulosExternos = {};
  for (const { aba, cab } of candidatas) {
    if (aba === principal.aba) continue;
    const usa = CAMPOS_SUPLEMENTARES.filter((c) => cab.map[c] !== undefined);
    if (!usa.length) continue;
    for (const campo of usa) {
      if (origens[campo] === undefined) {
        origens[campo] = aba.nome;
        rotulosExternos[campo] = texto(cab.headers[cab.map[campo]]);
      }
    }
    for (let i = cab.linhaIdx + 1; i < aba.linhas.length; i++) {
      const linha = aba.linhas[i] || [];
      const sku = texto(valorDaLinha(linha, cab.map, 'sku'));
      if (!sku) continue;
      const chave = sku.toUpperCase();
      const alvo = suplementos.get(chave) || {};
      for (const campo of usa) {
        if (alvo[campo] === undefined) alvo[campo] = valorDaLinha(linha, cab.map, campo);
      }
      suplementos.set(chave, alvo);
    }
  }
  if (suplementos.size) {
    assumicoes.push(`Colunas ausentes no catálogo foram completadas com as abas: ${[...new Set(Object.values(origens))].join(', ')}.`);
  }

  // 3) Monta os registros.
  const { map, linhaIdx } = principal.cab;
  for (const { campo } of CAMPOS) {
    if (map[campo] !== undefined) origens[campo] = principal.aba.nome;
  }
  // Rótulo de cada campo reconhecido (cabeçalho real, do catálogo ou da aba complementar).
  const colunas = {};
  for (const { campo, rotulo } of CAMPOS) {
    if (origens[campo] === undefined) continue;
    colunas[campo] = (map[campo] !== undefined ? texto(principal.cab.headers[map[campo]]) : rotulosExternos[campo]) || rotulo;
  }

  const skus = [];
  const vistos = new Set();
  const duplicados = [];
  let ignorados = 0;
  let semPeso = 0;
  let semEstoque = 0;
  let semPreco = 0;
  let semMultiplo = 0;

  for (let i = linhaIdx + 1; i < principal.aba.linhas.length; i++) {
    const linha = principal.aba.linhas[i] || [];
    const bruto = texto(valorDaLinha(linha, map, 'sku'));
    const vazia = linha.every((c) => c === null || c === undefined || texto(c) === '');
    if (vazia) continue;
    if (!bruto) { ignorados++; continue; }

    const sku = bruto;
    const chave = sku.toUpperCase();
    if (vistos.has(chave)) { duplicados.push(sku); continue; }
    vistos.add(chave);

    const sup = suplementos.get(chave) || {};
    const pegar = (campo) => {
      const v = valorDaLinha(linha, map, campo);
      return (v === null || v === undefined || texto(v) === '') ? (sup[campo] ?? null) : v;
    };

    const produto = texto(valorDaLinha(linha, map, 'produto')) || `SKU ${sku}`;
    const marca = texto(valorDaLinha(linha, map, 'marca'));

    const precoNum = numero(pegar('preco'));
    if (precoNum === null) semPreco++;
    const multNum = numero(pegar('multiplo'));
    if (multNum === null) semMultiplo++;

    const estoqueBruto = numero(pegar('estoque'));
    if (estoqueBruto === null) semEstoque++;

    const pesos = ['pesoF1', 'pesoF2', 'pesoF3'].map((c) => numero(pegar(c)));
    let [p1, p2, p3] = pesos;
    const temPeso = pesos.some((p) => p !== null && p > 0);

    let origemPeso = 'peso base da planilha';
    if (!temPeso) {
      // Sem pesos: usa vendas/demanda observadas como peso relativo (mesma proporção).
      const v1 = numero(pegar('vendasF1'));
      const total = numero(pegar('demandaTotal'));
      if (v1 !== null && v1 > 0) { p1 = v1; origemPeso = 'vendas Farmácia 1 (fallback)'; }
      else if (total !== null && total > 0) { p1 = total; origemPeso = 'demanda total do brick (fallback)'; }
      else { p1 = 1; origemPeso = 'peso uniforme (fallback)'; }
      p2 = 0; p3 = 0;
      semPeso++;
    }

    const foto = texto(valorDaLinha(linha, map, 'foto'))
      || (/^AC\d{3}$/i.test(sku) ? `img/${sku.toUpperCase()}.jpg` : '');

    skus.push({
      sku,
      foto,
      marca,
      produto,
      forma: texto(valorDaLinha(linha, map, 'forma')),
      embalagem: texto(valorDaLinha(linha, map, 'embalagem')),
      atc: texto(valorDaLinha(linha, map, 'atc')),
      ean: texto(valorDaLinha(linha, map, 'ean')),
      preco: precoNum === null ? 0 : precoNum,
      multiplo: multNum === null ? 1 : Math.max(1, Math.round(multNum)),
      estoque: estoqueBruto === null ? 0 : Math.max(0, Math.round(estoqueBruto)),
      peso: { F1: p1 || 0, F2: p2 || 0, F3: p3 || 0 },
      _origemPeso: origemPeso,
    });
  }

  // 4) Validações.
  if (!skus.length) erros.push('A planilha foi lida, mas não encontrei nenhuma linha de produto abaixo do cabeçalho.');
  if (duplicados.length) {
    const amostra = [...new Set(duplicados)].slice(0, 8).join(', ');
    erros.push(`Há ${duplicados.length} linha(s) com SKU repetido (${amostra}${duplicados.length > 8 ? ', …' : ''}). Cada SKU precisa aparecer uma única vez.`);
  }
  const somaPesos = skus.reduce((acc, s) => acc + s.peso.F1 + s.peso.F2 + s.peso.F3, 0);
  if (skus.length && somaPesos <= 0) {
    erros.push('A soma dos pesos-base ficou zero: inclua as colunas "Peso Base F1/F2/F3" (ou uma coluna de vendas/demanda) para o motor conseguir calibrar a demanda.');
  }
  if (semPeso) assumicoes.push(`${semPeso} SKU(s) sem peso-base na planilha. Usei as vendas ou a demanda observada como peso relativo (peso uniforme quando não havia nenhuma das duas).`);
  if (semEstoque) assumicoes.push(`${semEstoque} SKU(s) sem coluna de estoque. Assumi estoque 0, então aparecem como risco de ruptura.`);
  if (semPreco) avisos.push(`${semPreco} SKU(s) sem preço válido. Assumi R$ 0,00, o que subestima a ponte de receita nesses itens.`);
  if (semMultiplo) avisos.push(`${semMultiplo} SKU(s) sem múltiplo de caixa. Assumi 1 UN.`);
  if (ignorados) avisos.push(`${ignorados} linha(s) sem SKU foram ignoradas.`);

  const ok = erros.length === 0;

  return {
    ok,
    skus: ok ? skus.map(({ _origemPeso, ...s }) => s) : [],
    erros, avisos, assumicoes,
    colunas,
    origens,
    rotulosExternos,
    abas: abas.map((a) => a.nome),
    abaPrincipal: principal.aba.nome,
    lidos: skus.length,
    ignorados,
  };
}

/* ------------------------------------------------------------------ *
 * Exportação (modelo em branco / catálogo atual)
 * ------------------------------------------------------------------ */

export const CABECALHO_MODELO = [
  'SKU_ID', 'Marca', 'Produto', 'Forma Farmacêutica', 'Embalagem', 'Categoria ATC', 'EAN',
  'Preço Médio (R$)', 'Múltiplo Caixa Fornecedor (UN)', 'Estoque Atual (UN)',
  'Peso Base F1', 'Peso Base F2', 'Peso Base F3', 'Foto',
];

/** Gera um workbook .xlsx reimportável (usado no "baixar modelo" e no "exportar"). */
export function catalogoParaWorkbook(XLSX, skus = []) {
  const linhas = [CABECALHO_MODELO];
  for (const s of skus) {
    linhas.push([
      s.sku, s.marca, s.produto, s.forma, s.embalagem, s.atc, s.ean,
      s.preco, s.multiplo, s.estoque,
      s.peso ? s.peso.F1 : 0, s.peso ? s.peso.F2 : 0, s.peso ? s.peso.F3 : 0,
      s.foto,
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(linhas);
  ws['!cols'] = CABECALHO_MODELO.map((h) => ({ wch: Math.max(12, Math.min(34, h.length + 2)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo_SKUs');
  return wb;
}
