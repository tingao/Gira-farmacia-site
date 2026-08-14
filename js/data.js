/* GIRA — dados de referência (extraídos de GIRA_Simulacao_Brick_Antiacidos.xlsx)
 * Estrutura e fórmulas seguem o protótipo de referência (spec Fase 1).
 * Nomes de marca e produto são fictícios; preços calibrados por PMC CMED.
 */

const BRICK = {
  nome: '0881020 - MACEIO/AL - SIQUEIRA CAMPOS-560',
  farmaciaCliente: 'Farmácia 1',
  farmacias: [
    { id: 'F1', nome: 'Farmácia 1', cliente: true },
    { id: 'F2', nome: 'Farmácia 2', cliente: false },
    { id: 'F3', nome: 'Farmácia 3', cliente: false },
  ],
};

/* Parâmetros do modelo — valores padrão do protótipo. Todos editáveis na tela,
 * exceto o Fator de Calibração, que é calculado. */
const DEFAULT_PARAMS = {
  participacaoBrick: 0.003081,          // % do mercado nacional representado pelo brick
  pesoF1: 0.9,                          // peso de atratividade — Farmácia 1 (cliente)
  pesoF2: 1.3,                          // peso de atratividade — Farmácia 2
  pesoF3: 0.7,                          // peso de atratividade — Farmácia 3
  rampaEntrada: 0.6,                    // % do fair share capturado no 1º ciclo de SKU novo
  limAltoPotencial: 15,                 // UN/sem no brick — oportunidade de alto potencial
  limMonitorar: 10,                     // UN/sem no brick — piloto (monitorar)
  minProjIncluir: 3,                    // UN/sem — projeção mínima p/ incluir SKU novo
  limRemover: 5,                        // UN/sem no brick — abaixo disso, remover
  coberturaA: 2,                        // semanas de estoque-alvo — classe A
  coberturaB: 3,                        // semanas de estoque-alvo — classe B
  coberturaC: 4,                        // semanas de estoque-alvo — classe C
  corteA: 0.8,                          // corte cumulativo da curva ABC — classe A
  corteB: 0.95,                         // corte cumulativo da curva ABC — classe B
  margemExcesso: 1.5,                   // múltiplo da cobertura-alvo da classe p/ sinalizar excesso
  margemRuptura: 0.5,                   // múltiplo da cobertura-alvo da classe p/ risco de ruptura
  semanasPorMes: 4.33,                  // fator de conversão semanal → mensal
};

/* Referência de mercado nacional (fonte externa — não editável pelo usuário final) */
const MERCADO_NACIONAL = {
  fonte: 'Market_Matrix_National_Reference (calibrado com CMED/ANVISA)',
  volumeAnual: 8962000,
  faturamentoAnual: 1122745110,
  volumeSemanalEquivalente: 8962000 / 52,
  formas: [
    { forma: 'Efervescente', volumeAnual: 6590000, share: 6590000 / 8962000 },
    { forma: 'Mastigável/pastilha', volumeAnual: 1799000, share: 1799000 / 8962000 },
    { forma: 'Antiácido + antigás', volumeAnual: 339000, share: 339000 / 8962000 },
    { forma: 'Suspensão/gel', volumeAnual: 168000, share: 168000 / 8962000 },
  ],
};

/* Catálogo de SKUs + estoque atual em mãos (Farmácia 1) + peso-base de demanda
 * por farmácia do brick (insumo de calibração). */
const SKUS = [
  { sku: 'AC001',foto: null,  marca: 'Sallux', produto: 'Sallux Tradicional', forma: 'PO EFEV', embalagem: 'FR PLAS X 100G', atc: 'A02A1', ean: '789100000003', preco: 31.82, multiplo: 6,  estoque: 75, peso: { F1: 27, F2: 39, F3: 20 } },
  { sku: 'AC002',foto: 'img/AC002.jpg',  marca: 'Sallux', produto: 'Sallux Limão', forma: 'PO EFEV', embalagem: 'FR PLAS X 100G', atc: 'A02A1', ean: '789100000004', preco: 31.82, multiplo: 6,  estoque: 28, peso: { F1: 22, F2: 30, F3: 0 } },
  { sku: 'AC003',foto: 'img/AC003.jpg',  marca: 'Digesan', produto: 'Digesan Mastigável Original', forma: 'COM MAST', embalagem: 'CT BL X 20 CPR', atc: 'A02A1', ean: '789100000005', preco: 20.99, multiplo: 12, estoque: 0,  peso: { F1: 0, F2: 24, F3: 0 } },
  { sku: 'AC004',foto: 'img/AC004.jpg',  marca: 'Alivium Plus', produto: 'Alivium Plus Suspensão Menta', forma: 'SUSP OR', embalagem: 'FR X 240ML', atc: 'A02A1', ean: '789100000006', preco: 52.45, multiplo: 6,  estoque: 9,  peso: { F1: 16, F2: 22, F3: 0 } },
  { sku: 'AC005',foto: 'img/AC005.jpg',  marca: 'Digesan Pastilhas', produto: 'Digesan Pastilhas Menta', forma: 'COM MAST', embalagem: 'CT BL X 20 CPR', atc: 'A02A1', ean: '789100000007', preco: 19.55, multiplo: 12, estoque: 0,  peso: { F1: 0, F2: 15, F3: 0 } },
  { sku: 'AC006',foto: 'img/AC006.jpg',  marca: 'Gelcalm', produto: 'Gelcalm Suspensão Hortelã', forma: 'SUSP OR', embalagem: 'FR X 240ML', atc: 'A02A1', ean: '789100000008', preco: 29.38, multiplo: 6,  estoque: 24, peso: { F1: 19, F2: 28, F3: 14 } },
  { sku: 'AC007',foto: 'img/AC007.jpg',  marca: 'Gelcalm', produto: 'Gelcalm Mastigável Limão', forma: 'COM MAST', embalagem: 'CT BL X 24 CPR', atc: 'A02A1', ean: '789100000009', preco: 20.82, multiplo: 12, estoque: 0,  peso: { F1: 0, F2: 13, F3: 6 } },
  { sku: 'AC008',foto: null,  marca: 'Pansil', produto: 'Pansil Pó Efervescente Laranja', forma: 'PO EFEV', embalagem: 'CT 6 ENV X 5G', atc: 'A02A1', ean: '789100000010', preco: 18.98, multiplo: 24, estoque: 50, peso: { F1: 14, F2: 20, F3: 10 } },
  { sku: 'AC009',foto: 'img/AC009.jpg',  marca: 'Pansil', produto: 'Pansil Comprimido Mastigável', forma: 'COM MAST', embalagem: 'CT BL X 20 CPR', atc: 'A02A1', ean: '789100000011', preco: 23.99, multiplo: 12, estoque: 4,  peso: { F1: 7, F2: 9, F3: 5 } },
  { sku: 'AC010',foto: 'img/AC010.jpg',  marca: 'Estomax', produto: 'Estomax Tradicional (Abacaxi)', forma: 'PO EFEV', embalagem: 'DISP 50 SACHÊS X 5G', atc: 'A02A2', ean: '789100000012', preco: 171.73, multiplo: 4, estoque: 12, peso: { F1: 23, F2: 33, F3: 17 } },
  { sku: 'AC011',foto: 'img/AC011.jpg',  marca: 'Estomax', produto: 'Estomax Limão', forma: 'PO EFEV', embalagem: 'DISP 50 SACHÊS X 5G', atc: 'A02A2', ean: '789100000013', preco: 171.73, multiplo: 4, estoque: 0,  peso: { F1: 0, F2: 27, F3: 14 } },
  { sku: 'AC012',foto: 'img/AC012.jpg',  marca: 'Estomax', produto: 'Estomax Laranja (lançamento)', forma: 'PO EFEV', embalagem: 'DISP 50 SACHÊS X 5G', atc: 'A02A2', ean: '789100000014', preco: 171.73, multiplo: 4, estoque: 0,  peso: { F1: 0, F2: 12, F3: 0 } },
  { sku: 'AC013',foto: 'img/AC013.jpg',  marca: 'Genérico', produto: 'Genérico Hidróx. Alumínio+Magnésio', forma: 'SUSP OR', embalagem: 'FR X 100ML', atc: 'A02A1', ean: '789100000015', preco: 8.5, multiplo: 6, estoque: 14, peso: { F1: 11, F2: 15, F3: 7 } },
  { sku: 'AC014',foto: 'img/AC014.jpg',  marca: 'Genérico', produto: 'Genérico Bicarbonato de Sódio', forma: 'PO SL', embalagem: 'FR X 100GR', atc: 'A02A1', ean: '789100000016', preco: 6.9, multiplo: 6, estoque: 0,  peso: { F1: 0, F2: 0, F3: 9 } },
  { sku: 'AC015',foto: null,  marca: 'Bufferex', produto: 'Bufferex Suspensão 120ml', forma: 'SUSP OR', embalagem: 'FR PLAS X 120ML', atc: 'A02A1', ean: '789100000017', preco: 29.34, multiplo: 6, estoque: 20, peso: { F1: 2, F2: 0, F3: 0 } },
  { sku: 'AC016',foto: null,  marca: 'Bufferex', produto: 'Bufferex Suspensão 240ml', forma: 'SUSP OR', embalagem: 'FR VD AMB X 240ML', atc: 'A02A1', ean: '789100000018', preco: 47.22, multiplo: 6, estoque: 10, peso: { F1: 1, F2: 0, F3: 0 } },
];

const FORMA_LABEL = {
  'PO EFEV': 'Pó efervescente',
  'COM MAST': 'Comprimido mastigável',
  'SUSP OR': 'Suspensão oral',
  'PO SL': 'Pó solúvel',
};

/* Dimensões aproximadas (px) por forma farmacêutica — usadas no render de prateleira */
const FORMA_DIM = {
  'PO EFEV': { w: 62, h: 96 },
  'COM MAST': { w: 56, h: 82 },
  'SUSP OR': { w: 46, h: 112 },
  'PO SL': { w: 62, h: 90 },
};

/* Facings por classe ABC no planograma sugerido */
const FACINGS_ABC = { A: 4, B: 3, C: 2 };

const CLASSIFICACAO_INFO = {
  Manter:      { cor: '#2e7d32', bg: '#e6f4ea', label: 'Manter',       texto: 'Já no mix — manter e reabastecer' },
  Incluir:     { cor: '#1565c0', bg: '#e3f0fb', label: 'Incluir',      texto: 'Novo no mix — oportunidade validada pela demanda do brick' },
  Monitorar:   { cor: '#f9a825', bg: '#fff6e0', label: 'Monitorar',    texto: 'Piloto pequeno / lançamento — avaliar giro antes de expandir espaço' },
  'Não incluir': { cor: '#757575', bg: '#f0f0f0', label: 'Não incluir', texto: 'Baixo volume no brick — não justifica espaço de gôndola agora' },
  Remover:     { cor: '#c62828', bg: '#fdecea', label: 'Remover',      texto: 'SKU de baixo giro, sem demanda validada no brick — remover e liberar espaço/capital' },
};

const ABC_INFO = {
  A: { cor: '#1b5e20', bg: '#dcedc8', label: 'A — alto giro' },
  B: { cor: '#e65100', bg: '#ffe0b2', label: 'B — giro médio' },
  C: { cor: '#1565c0', bg: '#bbdefb', label: 'C — menor giro' },
};
