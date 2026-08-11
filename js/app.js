/* GIRA — camada de interface (renderização, estado, eventos) */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };

  const state = {
    params: { ...DEFAULT_PARAMS },
    estoques: Object.fromEntries(SKUS.map((s) => [s.sku, s.estoque])),
    filtro: { classificacao: '', classe: '', estoque: '', marca: '' },
    out: null,
  };

  const { fmtBRL, fmtNum, fmtPct } = GIRA;

  /* ---------- badges ---------- */
  const badgeClassificacao = (K) => {
    const i = CLASSIFICACAO_INFO[K];
    return `<span class="badge" style="background:${i.bg};color:${i.cor}">${i.label}</span>`;
  };
  const chipEstoque = (tipo) => {
    const map = {
      ruptura: ['#fdecea', '#c62828', 'Risco de ruptura'],
      excesso: ['#fff3e0', '#e65100', 'Excesso de estoque'],
      saudavel: ['#e6f4ea', '#2e7d32', 'Estoque saudável'],
      entrada: ['#e3f0fb', '#1565c0', 'Entrada inicial'],
      'nao-repor': ['#eceff1', '#546e7a', 'Não repor'],
    };
    const [bg, cor, txt] = map[tipo];
    return `<span class="chip" style="background:${bg};color:${cor}">${txt}</span>`;
  };
  const badgeABC = (P) => {
    if (!P) return '—';
    const i = ABC_INFO[P];
    return `<span class="badge" style="background:${i.bg};color:${i.cor}">${P}</span>`;
  };

  /* ---------- renderização geral ---------- */
  function renderAll() {
    state.out = GIRA.calcular(state.params, SKUS, state.estoques);
    renderCabecalho();
    renderResumo();
    renderAcoes();
    renderPlanograma();
    renderGap();
    renderVisual();
    renderParametros();
  }

  function renderCabecalho() {
    $('#brick-nome').textContent = BRICK.nome;
    $('#farmacia-cliente').textContent = BRICK.farmacias.map((f) => (f.cliente ? f.nome + ' (cliente)' : f.nome)).join(' · ');
    $('#resumo-farmacia').textContent = BRICK.farmaciaCliente;
  }

  function renderResumo() {
    const { kpis, ponte } = state.out;
    const cards = [
      ['SKUs no brick (mercado total)', kpis.skusBrick, '', 'azul'],
      ['SKUs no mix da farmácia', kpis.skusMix, 'em estoque hoje', ''],
      ['Sugeridos para inclusão', kpis.skusIncluir + kpis.skusMonitorar, `Incluir ${kpis.skusIncluir} · Monitorar ${kpis.skusMonitorar}`, 'positivo'],
      ['Recomendados para remoção', kpis.skusRemover, 'baixo giro sem demanda', 'alerta'],
      ['Em risco de ruptura', kpis.skusRuptura, 'repor com urgência', 'alerta'],
      ['Em excesso de estoque', kpis.skusExcesso, 'pausar compra', 'atencao'],
      ['Demanda da categoria no brick', fmtNum(kpis.demandaBrickTotal) + ' UN/sem', fmtNum(kpis.demandaBrickTotal * state.params.semanasPorMes) + ' UN/mês', 'azul'],
      ['Vendas atuais da farmácia', fmtNum(kpis.vendasF1Total) + ' UN/sem', `share atual ${fmtPct(kpis.shareAtual)}`, ''],
      ['Gap total não capturado', fmtNum(kpis.gapTotal) + ' UN/sem', 'inclui share perdido p/ concorrência', 'atencao'],
    ];
    const k = $('#kpis-operacionais');
    k.innerHTML = '';
    for (const [rotulo, valor, detalhe, cls] of cards) {
      const d = el('div', 'kpi ' + cls);
      d.appendChild(el('div', 'rotulo', rotulo));
      d.appendChild(el('div', 'valor', String(valor)));
      if (detalhe) d.appendChild(el('div', 'detalhe', detalhe));
      k.appendChild(d);
    }

    const p = $('#ponte-receita');
    p.innerHTML = '';
    const itens = [
      ['item', 'Receita atual da farmácia na categoria', fmtBRL(ponte.receitaAtual)],
      ['item ganho', '(+) Ganho com inclusão de SKUs novos', fmtBRL(ponte.ganhoInclusao)],
      ['item perda', '(−) Perda com remoção de SKUs de baixo giro', fmtBRL(ponte.perdaRemocao)],
      ['item total', '(=) Receita potencial com planograma otimizado', fmtBRL(ponte.receitaPotencial)],
    ];
    for (const [cls, rotulo, valor] of itens) {
      const d = el('div', cls);
      d.appendChild(el('div', 'rotulo', rotulo));
      d.appendChild(el('div', 'valor', valor));
      p.appendChild(d);
    }
    $('#nota-ponte').textContent =
      `Uplift de receita mensal projetado: ${fmtPct(ponte.uplift)}. O ganho soma apenas SKUs que passam a existir no mix (Incluir/Monitorar), com projeção por fair share + rampa de entrada — o share perdido em SKUs já vendidos é execução/competição e não entra nesta conta.`;
  }

  /* ---------- O que usar / o que não usar ---------- */
  function renderAcoes() {
    const { linhas } = state.out;
    const urgente = linhas.filter((l) => l.T.tipo === 'ruptura');
    const comprar = linhas.filter((l) => l.U > 0);
    const parar = linhas.filter((l) => l.K === 'Remover' || l.T.tipo === 'excesso');
    const naoEntrar = linhas.filter((l) => l.K === 'Não incluir');

    const lista = (titulo, cls, itens, fmt) => {
      const col = el('div', 'col ' + cls);
      col.appendChild(el('div', 'titulo', titulo + ` (${itens.length})`));
      const ul = el('ul');
      if (!itens.length) ul.appendChild(el('li', 'vazio', 'Nenhum item nesta lista.'));
      for (const l of itens) {
        const li = el('li');
        const txt = el('span', null, `<strong>${l.sk.produto}</strong> <span style="color:var(--cinza)">· ${l.sk.sku} · ${l.sk.marca}</span>`);
        li.appendChild(txt);
        li.appendChild(el('span', 'qtd', fmt(l)));
        ul.appendChild(li);
      }
      col.appendChild(ul);
      return col;
    };

    const c = $('#listas-acoes');
    c.innerHTML = '';
    c.appendChild(lista('🔴 Repor com urgência (risco de ruptura)', 'urgente', urgente, (l) => l.U > 0 ? `pedir ${l.U} UN` : `estoque ${l.estoque} UN`));
    c.appendChild(lista('🔵 Pedido semanal sugerido', 'comprar', comprar, (l) => `${l.U} UN (${l.sk.multiplo}/cx)`));
    c.appendChild(lista('🟠 Parar de comprar (remover / excesso)', 'parar', parar, (l) => l.K === 'Remover' ? 'remover do mix' : 'pausar compra'));
    c.appendChild(lista('⚪ Não entrar no mix agora', 'naoentrar', naoEntrar, () => 'sem espaço de gôndola'));
  }

  /* ---------- Planograma Sugerido ---------- */
  function renderPlanograma() {
    // popula os selects de filtro (uma única vez)
    preencherFiltros();

    const linhas = GIRA.filtrar(state.out.linhas, state.filtro);
    const cab = ['Foto', 'SKU', 'Produto', 'Demanda brick (UN/sem)', 'Vendas F1 (UN/sem)', 'Estoque atual (UN)', 'Estoque-alvo (UN)',
      'Classificação', 'Classe ABC', 'Cob. alvo (sem)', 'Cob. atual (sem)', 'Recomendação de estoque', 'Qtd. sugerida pedido (UN)', 'Receita-alvo (R$/sem)'];

    const t = el('table', 'dados');
    const thead = el('thead');
    const trh = el('tr');
    for (const h of cab) {
      const th = el('th', h !== 'Produto' && h !== 'Recomendação de estoque' && h !== 'Classificação' ? null : 'esq', h);
      trh.appendChild(th);
    }
    thead.appendChild(trh);
    t.appendChild(thead);

    const tbody = el('tbody');
    for (const l of linhas) {
      const tr = el('tr');
      const cells = [
        el('td', null, l.sk.foto
          ? `<img class="thumb" src="${l.sk.foto}" alt="${l.sk.produto}" loading="lazy">`
          : `<span class="thumb-ph" title="Sem foto cadastrada">${l.sk.sku}</span>`),
        el('td', null, l.sk.sku),
        el('td', 'esq', `<strong>${l.sk.produto}</strong><br><span style="color:var(--cinza);font-size:11.5px">${l.sk.marca} · ${l.sk.embalagem}</span>`),
        el('td', null, fmtNum(l.C, 1)),
        el('td', null, fmtNum(l.D, 1)),
        null, // estoque editável
        el('td', null, fmtNum(l.R, 1)),
        el('td', 'esq', badgeClassificacao(l.K)),
        el('td', null, badgeABC(l.classe)),
        el('td', null, l.Q || '—'),
        el('td', null, l.S === null ? '—' : fmtNum(l.S, 1) + ' sem'),
        el('td', 'esq', chipEstoque(l.T.tipo) + `<div style="font-size:11.5px;color:var(--cinza);margin-top:2px;max-width:280px;white-space:normal">${l.T.texto}</div>`),
        el('td', 'qtd-pedido', l.U > 0 ? `<span style="color:var(--azul)">${l.U}</span>` : (l.K === 'Remover' || l.K === 'Não incluir' ? '—' : '0')),
        el('td', null, fmtBRL(l.W)),
      ];
      // célula de estoque editável
      const tdE = el('td');
      const inp = el('input');
      inp.type = 'number';
      inp.min = 0;
      inp.step = 1;
      inp.value = l.estoque;
      inp.addEventListener('change', () => {
        const v = Math.max(0, Math.round(Number(inp.value) || 0));
        inp.value = v;
        state.estoques[l.sk.sku] = v;
        renderAll();
      });
      tdE.appendChild(inp);
      cells[5] = tdE;

      for (const c of cells) tr.appendChild(c);
      tbody.appendChild(tr);
    }
    t.appendChild(tbody);

    const wrap = $('#tabela-planograma');
    wrap.innerHTML = '';
    wrap.appendChild(t);
  }

  function preencherFiltros() {
    const mk = (id, opcoes, chave) => {
      const sel = $('#' + id);
      if (sel.dataset.pronto) return;
      sel.dataset.pronto = '1';
      for (const [v, label] of opcoes) {
        const o = el('option', null, label);
        o.value = v;
        sel.appendChild(o);
      }
      sel.addEventListener('change', () => {
        state.filtro[chave] = sel.value;
        renderAll();
      });
    };
    mk('filtro-classificacao', Object.entries(CLASSIFICACAO_INFO).map(([k, v]) => [k, v.label]), 'classificacao');
    mk('filtro-classe', [['A', 'A'], ['B', 'B'], ['C', 'C']].map(([v]) => [v, 'Classe ' + v]), 'classe');
    mk('filtro-estoque', [
      ['ruptura', 'Risco de ruptura'], ['excesso', 'Excesso de estoque'], ['saudavel', 'Estoque saudável'],
      ['entrada', 'Sem estoque — entrada inicial'], ['nao-repor', 'Não repor'],
    ], 'estoque');
    mk('filtro-marca', [...new Set(SKUS.map((s) => s.marca))].map((m) => [m, m]), 'marca');
  }

  /* ---------- Match & Gap ---------- */
  function renderGap() {
    const { matchGap, fatorCalibracao } = state.out;
    const cab = ['SKU', 'Produto', 'Demanda brick (UN/sem)', 'Vendas F1 (UN/sem)', 'Share F1 (%)', 'Gap total (UN/sem)',
      'Preço (R$)', 'Oport. de mix — SKUs novos (R$/sem)', 'Oport. (R$/mês)', 'Status no mercado', 'Decisão (planograma)'];
    const t = el('table', 'dados');
    const trh = el('tr');
    for (const h of cab) trh.appendChild(el('th', h === 'Produto' || h === 'Status no mercado' || h === 'Decisão (planograma)' ? 'esq' : null, h));
    const thead = el('thead'); thead.appendChild(trh); t.appendChild(thead);
    const tbody = el('tbody');
    for (const l of matchGap) {
      const tr = el('tr');
      const oportSem = l.D > 0 ? '—' : fmtBRL(l.oportunidadeSem);
      const oportMes = l.D > 0 ? '—' : fmtBRL(l.oportunidadeMes);
      const cols = [
        el('td', null, l.sk.sku),
        el('td', 'esq', `<strong>${l.sk.produto}</strong> <span style="color:var(--cinza)">· ${l.sk.marca}</span>`),
        el('td', null, fmtNum(l.C, 1)),
        el('td', null, fmtNum(l.D, 1)),
        el('td', null, fmtPct(l.share)),
        el('td', null, fmtNum(l.gap, 1)),
        el('td', null, fmtBRL(l.preco)),
        el('td', null, oportSem),
        el('td', null, oportMes),
        el('td', 'esq', l.status),
        el('td', 'esq', badgeClassificacao(l.K)),
      ];
      for (const c of cols) tr.appendChild(c);
      tbody.appendChild(tr);
    }
    // total
    const soma = (f) => matchGap.reduce((a, l) => a + f(l), 0);
    const tr = el('tr', 'total');
    const tc = [
      el('td', null, 'Total'),
      el('td', null, ''),
      el('td', null, fmtNum(soma((l) => l.C), 1)),
      el('td', null, fmtNum(soma((l) => l.D), 1)),
      el('td', null, fmtPct(state.out.kpis.shareAtual)),
      el('td', null, fmtNum(soma((l) => l.gap), 1)),
      el('td', null, ''),
      el('td', null, fmtBRL(soma((l) => l.oportunidadeSem))),
      el('td', null, fmtBRL(soma((l) => l.oportunidadeMes))),
      el('td', null, ''),
      el('td', null, ''),
    ];
    for (const c of tc) tr.appendChild(c);
    tbody.appendChild(tr);
    t.appendChild(tbody);
    const wrap = $('#tabela-gap');
    wrap.innerHTML = '';
    wrap.appendChild(t);
    $('#tab-gap').dataset.fator = fatorCalibracao.toFixed(6); // exposto para depuração/auditoria
  }

  /* ---------- Planograma Visual ---------- */
  function renderVisual() {
    const { prateleiras, ordemFormas } = state.out;
    const leg = $('#legenda-abc');
    leg.innerHTML = '';
    for (const [k, v] of Object.entries(ABC_INFO)) {
      leg.appendChild(el('span', null, `<span class="sw" style="background:${v.bg};border:1px solid ${v.cor}"></span><strong>${k}</strong> — ${v.label}`));
    }

    const cont = $('#prateleiras');
    cont.innerHTML = '';
    for (const forma of ordemFormas) {
      const linhas = prateleiras[forma];
      if (!linhas || !linhas.length) continue;
      const shelf = el('div', 'prateleira');
      const totalUn = linhas.reduce((a, l) => a + l.U, 0);
      shelf.appendChild(el('div', 'rotulo-prateleira', `${FORMA_LABEL[forma] || forma} <span>${linhas.length} produtos · pedido sugerido ${totalUn} UN</span>`));
      const grid = el('div', 'produtos');
      for (const l of linhas) {
        const info = ABC_INFO[l.classe];
        const card = el('div', 'produto');
        const foto = el('div', 'foto');
        if (l.sk.foto) {
          const img = el('img', null, '');
          img.src = l.sk.foto;
          img.alt = l.sk.produto;
          img.loading = 'lazy';
          foto.appendChild(img);
          foto.style.borderBottom = `3px solid ${info.cor}`;
        } else {
          foto.textContent = l.sk.marca.toUpperCase();
          foto.style.background = info.bg;
          foto.style.borderBottom = `3px solid ${info.cor}`;
        }
        card.appendChild(foto);
        const corpo = el('div', 'info');
        corpo.appendChild(el('div', 'nome', l.sk.produto));
        corpo.appendChild(el('div', 'marca', `${l.sk.sku} · ${l.sk.embalagem}`));
        const meta = el('div', 'meta');
        meta.appendChild(el('span', null, badgeABC(l.classe) + ` · cob. ${l.Q} sem`));
        meta.appendChild(el('span', 'pedido', l.U > 0 ? `🔵 ${l.U} UN` : (l.K === 'Remover' ? '🗑 remover' : '✅ ok')));
        corpo.appendChild(meta);
        card.appendChild(corpo);
        grid.appendChild(card);
      }
      shelf.appendChild(grid);
      cont.appendChild(shelf);
    }
  }

  /* ---------- Parâmetros ---------- */
  const CAMPOS = [
    ['participacaoBrick', 'Participação do brick no mercado nacional (%)', DEFAULT_PARAMS.participacaoBrick * 100, 'n', 'Principal driver do modelo: alterar recalcula todos os volumes, mantendo as proporções entre SKUs e farmácias.', 1, 'part'],
    ['pesoF1', 'Peso de atratividade — Farmácia 1 (cliente)', DEFAULT_PARAMS.pesoF1, 'n', 'Fator relativo de tráfego/conversão da farmácia cliente.', 2, 'peso'],
    ['pesoF2', 'Peso de atratividade — Farmácia 2', DEFAULT_PARAMS.pesoF2, 'n', 'Concorrente com maior fluxo no brick simulado.', 2, 'peso'],
    ['pesoF3', 'Peso de atratividade — Farmácia 3', DEFAULT_PARAMS.pesoF3, 'n', 'Farmácia menor / foco em preço.', 2, 'peso'],
    ['rampaEntrada', 'Rampa de entrada p/ SKU novo (%)', DEFAULT_PARAMS.rampaEntrada * 100, 'n', '% do fair share capturado no 1º ciclo ao incluir um SKU novo.', 1, 'part'],
    ['limAltoPotencial', 'Limite p/ "Oportunidade de alto potencial" (UN/sem)', DEFAULT_PARAMS.limAltoPotencial, 'i', 'Piso de demanda do brick acima do qual SKU ausente é prioridade de inclusão.', 0, 'un'],
    ['limMonitorar', 'Limite p/ "Monitorar" (UN/sem)', DEFAULT_PARAMS.limMonitorar, 'i', 'Piso intermediário: SKU entra como piloto, sem prioridade de espaço.', 0, 'un'],
    ['minProjIncluir', 'Demanda projetada mínima p/ incluir (UN/sem)', DEFAULT_PARAMS.minProjIncluir, 'i', 'Projeção mínima de venda própria para justificar inclusão.', 0, 'un'],
    ['limRemover', 'Limite mínimo de giro p/ permanecer no mix (UN/sem)', DEFAULT_PARAMS.limRemover, 'i', 'Abaixo disso, SKU já vendido é sinalizado para remoção.', 0, 'un'],
    ['coberturaA', 'Cobertura-alvo — Classe A (semanas)', DEFAULT_PARAMS.coberturaA, 'i', 'Maior giro exige menos semanas de estoque.', 0, 'sem'],
    ['coberturaB', 'Cobertura-alvo — Classe B (semanas)', DEFAULT_PARAMS.coberturaB, 'i', 'Giro intermediário.', 0, 'sem'],
    ['coberturaC', 'Cobertura-alvo — Classe C (semanas)', DEFAULT_PARAMS.coberturaC, 'i', 'Menor giro exige mais semanas (pedidos menos frequentes).', 0, 'sem'],
    ['corteA', 'Corte cumulativo da curva ABC — Classe A (%)', DEFAULT_PARAMS.corteA * 100, 'n', 'Pareto clássico (ex.: 80% da demanda acumulada).', 1, 'part'],
    ['corteB', 'Corte cumulativo da curva ABC — Classe B (%)', DEFAULT_PARAMS.corteB * 100, 'n', 'Até este %: classe B; acima: classe C.', 1, 'part'],
    ['margemExcesso', 'Margem de excesso (múltiplo da cobertura-alvo)', DEFAULT_PARAMS.margemExcesso, 'n', 'Acima deste múltiplo da cobertura da própria classe → excesso.', 2, 'x'],
    ['margemRuptura', 'Margem de risco de ruptura (múltiplo da cobertura-alvo)', DEFAULT_PARAMS.margemRuptura, 'n', 'Abaixo deste múltiplo da cobertura da própria classe → risco de ruptura.', 2, 'x'],
    ['semanasPorMes', 'Semanas por mês (fator de conversão)', DEFAULT_PARAMS.semanasPorMes, 'n', 'Projeta valores mensais a partir da demanda semanal.', 2, 'sem'],
  ];

  function renderParametros() {
    const form = $('#parametros-form');
    if (!form.dataset.pronto) {
      form.dataset.pronto = '1';
      for (const [chave, rotulo, valorIni, tipo, desc, dec, un] of CAMPOS) {
        const d = el('div', 'param');
        d.appendChild(el('label', null, rotulo));
        const inp = el('input');
        inp.type = 'number';
        inp.step = tipo === 'i' ? 1 : 10 ** -dec;
        inp.value = valorIni;
        inp.dataset.chave = chave;
        inp.dataset.dec = dec;
        inp.dataset.un = un;
        inp.addEventListener('change', () => {
          const v = Number(inp.value) || 0;
          state.params[chave] = un === 'part' ? v / 100 : v;
          renderAll();
        });
        d.appendChild(inp);
        d.appendChild(el('div', 'desc', desc));
        form.appendChild(d);
      }
      // Fator de calibração (calculado) + mercado
      const d = el('div', 'param');
      d.appendChild(el('label', null, 'Fator de Calibração (calculado)'));
      const inp = el('input', 'calculado');
      inp.type = 'text';
      inp.id = 'fator-cal';
      inp.readOnly = true;
      d.appendChild(inp);
      d.appendChild(el('div', 'desc', '= (Volume nacional semanal × Participação assumida) ÷ Soma do peso-base do brick. Nunca editado à mão.'));
      form.appendChild(d);
    }
    $('#fator-cal').value = state.out.fatorCalibracao.toFixed(6);
    $('#fator-cal').title = `Soma dos pesos-base do brick: ${state.out.somaPesos} UN`;
    // sincroniza inputs com o estado (após re-render por outra fonte)
    for (const inp of form.querySelectorAll('input[data-chave]')) {
      const chave = inp.dataset.chave;
      const v = state.params[chave];
      inp.value = inp.dataset.un === 'part' ? +(v * 100).toFixed(4) : v;
    }

    const m = $('#mercado-nacional');
    if (!m.dataset.pronto) {
      m.dataset.pronto = '1';
      m.appendChild(el('p', 'subtitulo', `Fonte: ${MERCADO_NACIONAL.fonte}`));
      const t = el('table', 'dados');
      const trh = el('tr');
      for (const h of ['Indicador', 'Valor']) trh.appendChild(el('th', h === 'Indicador' ? 'esq' : null, h));
      const thead = el('thead'); thead.appendChild(trh); t.appendChild(thead);
      const tbody = el('tbody');
      const linhas = [
        ['Volume nacional anual (UN)', fmtNum(MERCADO_NACIONAL.volumeAnual, 0)],
        ['Faturamento nacional anual (R$)', fmtBRL(MERCADO_NACIONAL.faturamentoAnual)],
        ['Volume nacional semanal equivalente (UN)', fmtNum(MERCADO_NACIONAL.volumeSemanalEquivalente, 1)],
      ];
      for (const [r, v] of linhas) {
        const tr = el('tr');
        tr.appendChild(el('td', 'esq', r));
        tr.appendChild(el('td', null, v));
        tbody.appendChild(tr);
      }
      t.appendChild(tbody);
      m.appendChild(t);
      m.appendChild(el('p', 'subtitulo', 'Composição por forma farmacêutica (benchmark de contexto, não usado diretamente no cálculo do brick):'));
      const t2 = el('table', 'dados');
      const trh2 = el('tr');
      for (const h of ['Forma', 'Volume anual (UN)', 'Share do mercado']) trh2.appendChild(el('th', h === 'Forma' ? 'esq' : null, h));
      const thead2 = el('thead'); thead2.appendChild(trh2); t2.appendChild(thead2);
      const tbody2 = el('tbody');
      for (const f of MERCADO_NACIONAL.formas) {
        const tr = el('tr');
        tr.appendChild(el('td', 'esq', f.forma));
        tr.appendChild(el('td', null, fmtNum(f.volumeAnual, 0)));
        tr.appendChild(el('td', null, fmtPct(f.share)));
        tbody2.appendChild(tr);
      }
      t2.appendChild(tbody2);
      m.appendChild(t2);
    }
  }

  /* ---------- abas ---------- */
  $('#tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('section.tab-panel').forEach((s) => s.classList.remove('active'));
    $('#tab-' + btn.dataset.tab).classList.add('active');
  });

  $('#btn-imprimir-plano').addEventListener('click', () => window.print());
  $('#btn-imprimir-visual').addEventListener('click', () => window.print());

  renderAll();
})();
