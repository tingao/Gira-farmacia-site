/* GIRA — motor de cálculo. Porta 1:1 de js/engine.js do repo (módulos 3.4 Demanda do
 * Brick, 3.5 Match & Gap, 3.6 Planograma Sugerido, 3.7 Planograma Visual/Gôndolas,
 * 3.8 Resumo Executivo). Recalculável sob demanda. */
import { MERCADO_NACIONAL, CLASSIFICACAO_INFO } from './gira-data.js';

export function calcular(params, skus, estoques) {
  const s = { ...params };
  const skuMap = skus.map((sk) => ({ ...sk, estoque: estoques[sk.sku] ?? sk.estoque }));

  const somaPesos = skuMap.reduce((acc, sk) => acc + sk.peso.F1 + sk.peso.F2 + sk.peso.F3, 0);
  const fatorCalibracao = (MERCADO_NACIONAL.volumeSemanalEquivalente * s.participacaoBrick) / somaPesos;

  const brick = skuMap.map((sk) => {
    const dF1 = sk.peso.F1 * fatorCalibracao;
    const dF2 = sk.peso.F2 * fatorCalibracao;
    const dF3 = sk.peso.F3 * fatorCalibracao;
    return { sku: sk.sku, total: dF1 + dF2 + dF3, dF1, dF2, dF3 };
  });
  const demandaBrick = (sku) => brick.find((b) => b.sku === sku.sku).total;
  const vendasF1 = (sku) => brick.find((b) => b.sku === sku.sku).dF1;

  const linhas = skuMap
    .map((sk) => {
      const C = demandaBrick(sk);
      const D = vendasF1(sk);
      const b = brick.find((x) => x.sku === sk.sku);
      const pesoOutras = (b.dF2 > 0 ? s.pesoF2 : 0) + (b.dF3 > 0 ? s.pesoF3 : 0);
      const pesoTotal = s.pesoF1 + pesoOutras;
      const fairShare = pesoTotal > 0 ? s.pesoF1 / pesoTotal : 0;
      const projNovo = C * fairShare * s.rampaEntrada;

      let K;
      if (D > 0) K = C < s.limRemover ? 'Remover' : 'Manter';
      else if (C >= s.limAltoPotencial && projNovo >= s.minProjIncluir) K = 'Incluir';
      else if (C >= s.limMonitorar) K = 'Monitorar';
      else K = 'Não incluir';

      const J = D > 0 ? (K === 'Remover' ? 0 : D) : (K === 'Não incluir' ? 0 : projNovo);

      return { sk, C, D, pesoOutras, pesoTotal, fairShare, projNovo, K, J, estoque: sk.estoque, preco: sk.preco, multiplo: sk.multiplo };
    })
    .sort((a, b) => b.C - a.C || a.sk.sku.localeCompare(b.sk.sku));

  const jsPositivos = linhas.filter((l) => l.J > 0).map((l) => l.J).sort((a, b) => b - a);
  const somaJ = linhas.reduce((a, l) => a + l.J, 0);
  const rankDe = (v) => {
    if (v <= 0) return null;
    let rank = 1;
    for (const j of jsPositivos) if (j > v) rank++;
    return rank;
  };
  const linhasABC = linhas.map((l) => {
    const rank = rankDe(l.J);
    let O = null;
    if (rank !== null) {
      const cum = linhas.filter((x) => rankDe(x.J) !== null && rankDe(x.J) <= rank).reduce((a, x) => a + x.J, 0);
      O = somaJ > 0 ? cum / somaJ : 0;
    }
    const P = rank === null ? null : O <= s.corteA ? 'A' : O <= s.corteB ? 'B' : 'C';
    return { ...l, rank, cumO: O, classe: P };
  });

  const linhasFinais = linhasABC.map((l) => {
    const Q = l.K === 'Não incluir' || l.K === 'Remover' ? 0
      : l.classe === 'A' ? s.coberturaA : l.classe === 'B' ? s.coberturaB : s.coberturaC;
    const R = l.J * Q;
    const S = l.D > 0 ? l.estoque / l.D : null;

    let T;
    if (l.K === 'Remover') {
      T = { tipo: 'nao-repor', texto: `Não repor — vender estoque restante (~${(S ?? 0).toFixed(1)} sem. de giro residual)` };
    } else if (l.D === 0) {
      T = { tipo: 'entrada', texto: 'Sem estoque atual — pedido de entrada inicial' };
    } else if (S > Q * s.margemExcesso) {
      T = { tipo: 'excesso', texto: `Excesso de estoque (classe ${l.classe}, alvo ${Q} sem.) — pausar compra até normalizar` };
    } else if (S < Q * s.margemRuptura) {
      T = { tipo: 'ruptura', texto: `Risco de ruptura (classe ${l.classe}, alvo ${Q} sem.) — repor com urgência` };
    } else {
      T = { tipo: 'saudavel', texto: `Estoque saudável (classe ${l.classe}) — repor conforme padrão` };
    }

    const U = (l.K === 'Não incluir' || l.K === 'Remover') ? 0 : Math.ceil(Math.max(0, R - l.estoque) / l.multiplo) * l.multiplo;
    const W = l.J * l.preco;

    return {
      ...l, Q, R, S, T, U, W,
      motivo: CLASSIFICACAO_INFO[l.K].texto,
    };
  });

  const matchGap = linhasFinais.map((l) => {
    const share = l.C > 0 ? l.D / l.C : 0;
    const gap = l.C - l.D;
    const oportunidadeSem = l.D > 0 ? 0 : l.W;
    const status = l.D === 0
      ? (l.C >= s.limAltoPotencial ? 'Oportunidade de inclusão (alto potencial)' : 'Avaliar — baixo volume / lançamento')
      : `No mix atual — share ${(share * 100).toFixed(1)}% (gap = concorrência, não é oportunidade de mix)`;
    return { ...l, share, gap, oportunidadeSem, oportunidadeMes: oportunidadeSem * s.semanasPorMes, status };
  });

  const soma = (f) => linhasFinais.reduce((a, l) => a + f(l), 0);
  const kpis = {
    skusBrick: linhasFinais.length,
    skusMix: linhasFinais.filter((l) => l.D > 0).length,
    skusIncluir: linhasFinais.filter((l) => l.K === 'Incluir').length,
    skusMonitorar: linhasFinais.filter((l) => l.K === 'Monitorar').length,
    skusRemover: linhasFinais.filter((l) => l.K === 'Remover').length,
    skusRuptura: linhasFinais.filter((l) => l.T.tipo === 'ruptura').length,
    skusExcesso: linhasFinais.filter((l) => l.T.tipo === 'excesso').length,
    demandaBrickTotal: soma((l) => l.C),
    vendasF1Total: soma((l) => l.D),
    shareAtual: 0,
    gapTotal: matchGap.reduce((a, l) => a + l.gap, 0),
  };
  kpis.shareAtual = kpis.demandaBrickTotal > 0 ? kpis.vendasF1Total / kpis.demandaBrickTotal : 0;
  const receitaAtual = soma((l) => l.D * l.preco) * s.semanasPorMes;
  const ganhoInclusao = matchGap.reduce((a, l) => a + l.oportunidadeSem, 0) * s.semanasPorMes;
  const perdaRemocao = linhasFinais.filter((l) => l.K === 'Remover').reduce((a, l) => a + l.D * l.preco, 0) * s.semanasPorMes;
  const receitaPotencial = receitaAtual + ganhoInclusao - perdaRemocao;
  const ponte = { receitaAtual, ganhoInclusao, perdaRemocao, receitaPotencial, uplift: receitaAtual > 0 ? (receitaPotencial - receitaAtual) / receitaAtual : 0 };

  const prateleiras = {};
  for (const l of linhasFinais) {
    if (l.K === 'Remover' || l.K === 'Não incluir') continue;
    (prateleiras[l.sk.forma] = prateleiras[l.sk.forma] || []).push(l);
  }
  const ordemFormas = ['PO EFEV', 'COM MAST', 'SUSP OR', 'PO SL'];

  return { params: s, fatorCalibracao, somaPesos, linhas: linhasFinais, matchGap, kpis, ponte, prateleiras, ordemFormas };
}

export function filtrar(linhas, filtro) {
  return linhas.filter((l) => {
    if (filtro.classificacao && l.K !== filtro.classificacao) return false;
    if (filtro.classe && l.classe !== filtro.classe) return false;
    if (filtro.estoque && l.T.tipo !== filtro.estoque) return false;
    if (filtro.marca && l.sk.marca !== filtro.marca) return false;
    return true;
  });
}

/* --- 3.7 Gôndola física (merchandising): ranking por sortKey, split 40% nível dos
 * olhos / 30% topo / 30% base — mesma regra do protótipo de referência. --- */
export function montarGondola(linhas, opts) {
  const ordenadas = [...linhas].sort((a, b) => (opts.sortKey(b) - opts.sortKey(a)) || a.sk.sku.localeCompare(b.sk.sku));
  const n = ordenadas.length;
  const eyeCount = Math.ceil(n * 0.4);
  const topCount = Math.ceil((n - eyeCount) * 0.5);
  const eye = ordenadas.slice(0, eyeCount);
  const topo = ordenadas.slice(eyeCount, eyeCount + topCount);
  const base = ordenadas.slice(eyeCount + topCount);
  const prateleiras = [
    { label: 'Prateleira 1 · Topo', items: topo },
    { label: 'Prateleira 2 · Nível dos olhos', items: eye.filter((_, i) => i % 2 === 0) },
    { label: 'Prateleira 3 · Nível dos olhos', items: eye.filter((_, i) => i % 2 === 1) },
    { label: 'Prateleira 4 · Base', items: base },
  ].filter((p) => p.items.length > 0).map((p) => ({
    label: p.label,
    items: p.items.map((l) => ({ l, facings: opts.facing(l) })),
  }));

  /* Padroniza o total de colunas: todas as prateleiras ficam com o mesmo número
   * total de facings. Prateleiras com menos colunas recebem facings extras
   * (repetindo o mesmo produto), distribuídas ciclicamente entre os produtos. */
  const totalDe = (p) => p.items.reduce((a, it) => a + it.facings, 0);
  const alvo = Math.max(...prateleiras.map(totalDe));
  for (const p of prateleiras) {
    let falta = alvo - totalDe(p);
    let i = 0;
    while (falta > 0) {
      p.items[i % p.items.length].facings += 1;
      i += 1;
      falta -= 1;
    }
  }

  return prateleiras;
}
/* Facings uniformes por produto: todas as prateleiras exibem o mesmo número de
 * "rows" (imagens) por SKU — o volume de cada um continua visível no selo/badge. */
export const FACINGS_PADRAO = 2;
export const faceEstoque = () => FACINGS_PADRAO;
export const facePedido = () => FACINGS_PADRAO;

export const fmtBRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtNum = (v, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtPct = (v, d = 1) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
