/* GIRA — dados de referência (extraídos de GIRA_Simulacao_Brick_Antiacidos.xlsx)
 * Porta 1:1 de js/data.js do repo tingao/Gira-farmacia-site — mesmos valores e fórmulas.
 * Nomes de marca e produto são fictícios; preços calibrados por PMC CMED. */

export const BRICK = {
  nome: '0881020 - MACEIO/AL - SIQUEIRA CAMPOS-560',
  farmaciaCliente: 'Farmácia 1',
  farmacias: [
    { id: 'F1', nome: 'Farmácia 1', cliente: true },
    { id: 'F2', nome: 'Farmácia 2', cliente: false },
    { id: 'F3', nome: 'Farmácia 3', cliente: false },
  ],
};

export const DEFAULT_PARAMS = {
  participacaoBrick: 0.003081,
  pesoF1: 0.9,
  pesoF2: 1.3,
  pesoF3: 0.7,
  rampaEntrada: 0.6,
  limAltoPotencial: 15,
  limMonitorar: 10,
  minProjIncluir: 3,
  limRemover: 5,
  coberturaA: 2,
  coberturaB: 3,
  coberturaC: 4,
  corteA: 0.8,
  corteB: 0.95,
  margemExcesso: 1.5,
  margemRuptura: 0.5,
  semanasPorMes: 4.33,
};

export const MERCADO_NACIONAL = {
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

export const SKUS = [
  { sku: 'AC001', foto: 'img/AC001.jpg', marca: 'Sallux', produto: 'Sallux Tradicional', forma: 'PO EFEV', embalagem: 'FR PLAS X 100G', atc: 'A02A1', ean: '789100000003', preco: 31.82, multiplo: 6, estoque: 75, peso: { F1: 27, F2: 39, F3: 20 } },
  { sku: 'AC002', foto: 'img/AC002.jpg', marca: 'Sallux', produto: 'Sallux Limão', forma: 'PO EFEV', embalagem: 'FR PLAS X 100G', atc: 'A02A1', ean: '789100000004', preco: 31.82, multiplo: 6, estoque: 28, peso: { F1: 22, F2: 30, F3: 0 } },
  { sku: 'AC003', foto: 'img/AC003.jpg', marca: 'Digesan', produto: 'Digesan Mastigável Original', forma: 'COM MAST', embalagem: 'CT BL X 20 CPR', atc: 'A02A1', ean: '789100000005', preco: 20.99, multiplo: 12, estoque: 0, peso: { F1: 0, F2: 24, F3: 0 } },
  { sku: 'AC004', foto: 'img/AC004.jpg', marca: 'Alivium Plus', produto: 'Alivium Plus Suspensão Menta', forma: 'SUSP OR', embalagem: 'FR X 240ML', atc: 'A02A1', ean: '789100000006', preco: 52.45, multiplo: 6, estoque: 9, peso: { F1: 16, F2: 22, F3: 0 } },
  { sku: 'AC005', foto: 'img/AC005.jpg', marca: 'Digesan Pastilhas', produto: 'Digesan Pastilhas Menta', forma: 'COM MAST', embalagem: 'CT BL X 20 CPR', atc: 'A02A1', ean: '789100000007', preco: 19.55, multiplo: 12, estoque: 0, peso: { F1: 0, F2: 15, F3: 0 } },
  { sku: 'AC006', foto: 'img/AC006.jpg', marca: 'Gelcalm', produto: 'Gelcalm Suspensão Hortelã', forma: 'SUSP OR', embalagem: 'FR X 240ML', atc: 'A02A1', ean: '789100000008', preco: 29.38, multiplo: 6, estoque: 24, peso: { F1: 19, F2: 28, F3: 14 } },
  { sku: 'AC007', foto: 'img/AC007.jpg', marca: 'Gelcalm', produto: 'Gelcalm Mastigável Limão', forma: 'COM MAST', embalagem: 'CT BL X 24 CPR', atc: 'A02A1', ean: '789100000009', preco: 20.82, multiplo: 12, estoque: 0, peso: { F1: 0, F2: 13, F3: 6 } },
  { sku: 'AC008', foto: 'img/AC008.jpg', marca: 'Pansil', produto: 'Pansil Pó Efervescente Laranja', forma: 'PO EFEV', embalagem: 'CT 6 ENV X 5G', atc: 'A02A1', ean: '789100000010', preco: 18.98, multiplo: 24, estoque: 50, peso: { F1: 14, F2: 20, F3: 10 } },
  { sku: 'AC009', foto: 'img/AC009.jpg', marca: 'Pansil', produto: 'Pansil Comprimido Mastigável', forma: 'COM MAST', embalagem: 'CT BL X 20 CPR', atc: 'A02A1', ean: '789100000011', preco: 23.99, multiplo: 12, estoque: 4, peso: { F1: 7, F2: 9, F3: 5 } },
  { sku: 'AC010', foto: 'img/AC010.jpg', marca: 'Estomax', produto: 'Estomax Tradicional (Abacaxi)', forma: 'PO EFEV', embalagem: 'DISP 50 SACHÊS X 5G', atc: 'A02A2', ean: '789100000012', preco: 171.73, multiplo: 4, estoque: 12, peso: { F1: 23, F2: 33, F3: 17 } },
  { sku: 'AC011', foto: 'img/AC011.jpg', marca: 'Estomax', produto: 'Estomax Limão', forma: 'PO EFEV', embalagem: 'DISP 50 SACHÊS X 5G', atc: 'A02A2', ean: '789100000013', preco: 171.73, multiplo: 4, estoque: 0, peso: { F1: 0, F2: 27, F3: 14 } },
  { sku: 'AC012', foto: 'img/AC012.jpg', marca: 'Estomax', produto: 'Estomax Laranja (lançamento)', forma: 'PO EFEV', embalagem: 'DISP 50 SACHÊS X 5G', atc: 'A02A2', ean: '789100000014', preco: 171.73, multiplo: 4, estoque: 0, peso: { F1: 0, F2: 12, F3: 0 } },
  { sku: 'AC013', foto: 'img/AC013.jpg', marca: 'Genérico', produto: 'Genérico Hidróx. Alumínio+Magnésio', forma: 'SUSP OR', embalagem: 'FR X 100ML', atc: 'A02A1', ean: '789100000015', preco: 8.5, multiplo: 6, estoque: 14, peso: { F1: 11, F2: 15, F3: 7 } },
  { sku: 'AC014', foto: 'img/AC014.jpg', marca: 'Genérico', produto: 'Genérico Bicarbonato de Sódio', forma: 'PO SL', embalagem: 'FR X 100GR', atc: 'A02A1', ean: '789100000016', preco: 6.9, multiplo: 6, estoque: 0, peso: { F1: 0, F2: 0, F3: 9 } },
  { sku: 'AC015', foto: 'img/AC015.jpg', marca: 'Bufferex', produto: 'Bufferex Suspensão 120ml', forma: 'SUSP OR', embalagem: 'FR PLAS X 120ML', atc: 'A02A1', ean: '789100000017', preco: 29.34, multiplo: 6, estoque: 20, peso: { F1: 2, F2: 0, F3: 0 } },
  { sku: 'AC016', foto: 'img/AC016.jpg', marca: 'Bufferex', produto: 'Bufferex Suspensão 240ml', forma: 'SUSP OR', embalagem: 'FR VD AMB X 240ML', atc: 'A02A1', ean: '789100000018', preco: 47.22, multiplo: 6, estoque: 10, peso: { F1: 1, F2: 0, F3: 0 } },
];

export const FORMA_LABEL = {
  'PO EFEV': 'Pó efervescente',
  'COM MAST': 'Comprimido mastigável',
  'SUSP OR': 'Suspensão oral',
  'PO SL': 'Pó solúvel',
};

/* Classificação de decisão + Classe ABC + status de estoque: cores mapeadas para os
 * tokens do Broadsheet — cyan (accent) lê como sinal positivo/interativo, magenta
 * (accent-2) é o sinal de risco (ruptura, remoção); excesso usa o texto em magenta
 * sobre neutro, mais discreto que um selo cheio, para não empatar com o crítico. */
export const WARNING_STYLE = 'background:var(--color-neutral-100);color:var(--color-accent-2-700)';

export const CLASSIFICACAO_INFO = {
  Manter: { tag: 'tag tag-neutral', style: '', label: 'Manter', texto: 'Já no mix — manter e reabastecer' },
  Incluir: { tag: 'tag tag-accent', style: '', label: 'Incluir', texto: 'Novo no mix — oportunidade validada pela demanda do brick' },
  Monitorar: { tag: 'tag tag-outline', style: '', label: 'Monitorar', texto: 'Piloto pequeno / lançamento — avaliar giro antes de expandir espaço' },
  'Não incluir': { tag: 'tag tag-neutral', style: '', label: 'Não incluir', texto: 'Baixo volume no brick — não justifica espaço de gôndola agora' },
  Remover: { tag: 'tag tag-accent-2', style: '', label: 'Remover', texto: 'SKU de baixo giro, sem demanda validada no brick — remover e liberar espaço/capital' },
};

export const ABC_INFO = {
  A: { tag: 'tag tag-accent', style: '', label: 'A — alto giro' },
  B: { tag: 'tag tag-outline', style: '', label: 'B — giro médio' },
  C: { tag: 'tag tag-neutral', style: '', label: 'C — menor giro' },
};

export const ESTOQUE_INFO = {
  ruptura: { tag: 'tag tag-accent-2', style: '', label: 'Risco de ruptura' },
  excesso: { tag: 'tag', style: WARNING_STYLE, label: 'Excesso de estoque' },
  saudavel: { tag: 'tag tag-outline', style: '', label: 'Estoque saudável' },
  entrada: { tag: 'tag tag-accent', style: '', label: 'Entrada inicial' },
  'nao-repor': { tag: 'tag tag-neutral', style: '', label: 'Não repor' },
};
