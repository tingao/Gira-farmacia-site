# GIRA — Controle de Estoque & Planograma (Fase 1)

Ferramenta web de otimização de ponto de venda para farmácias — **Demand Loop, Fase 1: Planograma Desejado**.

Site 100% estático (sem build, sem servidor) — hospedado via GitHub Pages. Abra `index.html` ou use a URL pública acima.

## Funcionalidades

- **Resumo Executivo** — KPIs operacionais e ponte de receita (atual → potencial, com uplift projetado).
- **O que usar / o que não usar** — listas prontas: repor com urgência (risco de ruptura), pedido semanal sugerido, parar de comprar (remover/excesso), não entrar no mix.
- **Planograma Sugerido** — motor de decisão SKU a SKU: classificação (Manter/Incluir/Monitorar/Não incluir/Remover), curva ABC de giro, cobertura-alvo por classe, recomendação de estoque e quantidade sugerida de pedido (respeitando o múltiplo de caixa do fornecedor). Estoque atual editável — tudo recalcula na hora.
- **Match & Gap** — comparação da demanda do brick com as vendas da farmácia.
- **Planograma Visual** — prateleiras por forma farmacêutica, com foto do produto e cor por classe ABC, pronto para impressão.
- **Parâmetros** — todas as premissas do modelo editáveis (participação de mercado, pesos de atratividade, rampa de entrada, cortes ABC, coberturas-alvo, margens de excesso/ruptura).

## Estrutura

```
index.html        interface
css/style.css     estilos (com regras de impressão)
js/data.js        dados de demonstração: catálogo de SKUs, pesos por farmácia, referência de mercado
js/engine.js      motor de cálculo (Demanda do Brick, Match & Gap, Planograma Sugerido, Resumo Executivo)
js/app.js         estado, renderização e eventos
img/              fotos dos produtos (512×512)
```

> **Dados simulados**: nomes de marca e produto são fictícios; preços calibrados com referências reais de mercado (PMC CMED). Este é um protótipo de demonstração da Fase 1.
