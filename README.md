# GIRA: controle de estoque e planograma (Fase 1)

Ferramenta web de otimização de ponto de venda para farmácias. Implementa a Fase 1 do Demand Loop, o Planograma Desejado.

Site estático, sem build e sem servidor, hospedado no GitHub Pages.

## Acesso (mock)

O site abre com uma tela de login de demonstração, feita no cliente. Não é segurança real.

```
Usuário: gira@email.com
Senha:   teste
```

Qualquer outra combinação é recusada. A sessão fica ativa na aba (sessionStorage) enquanto o navegador estiver aberto, e o botão **Sair** no topo encerra a sessão e volta ao login.

## Funcionalidades

- **Resumo Executivo:** KPIs operacionais e ponte de receita, com o valor atual, o potencial e o uplift projetado.
- **O que usar / o que não usar:** listas prontas para repor com urgência (risco de ruptura), pedido semanal sugerido, parar de comprar (remover ou excesso) e não entrar no mix.
- **Gôndola atual:** as fotos dos produtos posicionadas nas prateleiras por forma farmacêutica, no estilo do OPENCatman, com selo de estoque.
- **Gôndola sugerida:** como a gôndola fica com o planograma do GIRA (Manter/Incluir/Monitorar), incluindo os SKUs novos.
- **Gôndola atual e sugerida:** comparação lado a lado, com facings por classe ABC (A=4, B=3, C=2) e quantidade sugerida de pedido.
- **Planograma Sugerido:** decisão SKU a SKU, com classificação (Manter/Incluir/Monitorar/Não incluir/Remover), curva ABC de giro, cobertura-alvo por classe, recomendação de estoque e quantidade sugerida de pedido respeitando o múltiplo de caixa do fornecedor. O estoque atual é editável e tudo recalcula na hora.
- **Match & Gap:** comparação da demanda do brick com as vendas da farmácia.
- **Planograma Visual:** prateleiras por forma farmacêutica, com foto do produto e cor por classe ABC, prontas para impressão.
- **Parâmetros:** todas as premissas do modelo são editáveis (participação de mercado, pesos de atratividade, rampa de entrada, cortes ABC, coberturas-alvo, margens de excesso e de ruptura).
- **Importar catálogo (XLSX):** envie uma planilha `.xlsx` com os seus produtos e o site recalcula tudo com ela. Detalhes abaixo.

## Importar produtos e dados (XLSX)

O botão **Importar produtos (XLSX)**, no topo da página, abre a aba **Importar catálogo**. A planilha é lida inteiramente no navegador, com a biblioteca SheetJS, e nada é enviado para nenhum servidor. O catálogo importado fica salvo apenas neste navegador (`localStorage`), e pode ser substituído ou restaurado a qualquer momento.

Aceita tanto o protótipo `GIRA_Simulacao_Brick_Antiacidos.xlsx` quanto uma planilha simples com a aba de catálogo:

- O cabeçalho pode estar em qualquer uma das primeiras 15 linhas (títulos acima são ignorados) e a ordem das colunas não importa.
- Números no formato brasileiro (`1.234,56`, `31,82`) e valores como `R$ 31,82` são aceitos.

| Coluna | Obrigatória | Para que serve |
|---|---|---|
| `SKU_ID` | Sim | Chave do SKU; liga o catálogo às demais abas |
| `Produto` | Recomendada | Nome exibido no planograma (se faltar, usa o código) |
| `Marca` | Opcional | Fabricante ou laboratório |
| `Forma Farmacêutica` | Opcional | Define a prateleira (ex.: `PO EFEV`, `COM MAST`, `SUSP OR`, `PO SL`) |
| `Embalagem` | Opcional | Apresentação (ex.: `FR PLAS X 100G`) |
| `Categoria ATC` / `EAN` | Opcional | Contexto da categoria e código de barras |
| `Preço Médio (R$)` | Opcional | Ponte de receita e oportunidade de mix |
| `Múltiplo Caixa Fornecedor (UN)` | Opcional | Arredonda a quantidade sugerida de pedido |
| `Estoque Atual (UN)` | Opcional | Define risco de ruptura e excesso |
| `Peso Base F1/F2/F3` | Sim\* | Principal calibrador da demanda do brick |
| `Foto` | Opcional | URL ou caminho (ex.: `img/AC001.jpg`) |

\* Sem colunas de peso, o importador usa as vendas ou a demanda observada como peso relativo e avisa no relatório. Sem nenhuma das duas, usa peso uniforme.

No protótipo completo, as colunas de peso vêm da aba `Demanda_Brick` e o estoque da aba `Planograma_Sugerido`, automaticamente. O painel mostra um relatório com as colunas reconhecidas, a aba de origem de cada uma e as premissas assumidas. Há também os botões **Baixar modelo** (planilha de exemplo reimportável) e **Exportar catálogo atual**.

O importador recusa arquivos sem uma coluna `SKU_ID` (ou `SKU`/`Código`), planilhas sem nenhuma linha de produto e SKUs repetidos. Em todos os casos ele informa o que corrigir e mantém o catálogo em uso.

## Estrutura

```
index.html        interface
_ds/broadsheet-…  design system (tokens + React 18)
gira-data.js      dados de demonstração: catálogo de SKUs, pesos por farmácia, referência de mercado
gira-engine.js    motor de cálculo (Demanda do Brick, Match & Gap, Planograma Sugerido, Gôndolas, Resumo Executivo)
gira-import.js    importação de catálogo .xlsx (leitura, mapeamento de colunas e validação)
vendor/           SheetJS 0.20.3 (leitura de .xlsx no navegador)
support.js        runtime do framework Dc + login mock
img/              fotos dos produtos (512×512)
```

> **Dados simulados**: nomes de marca e produto são fictícios; preços calibrados com referências reais de mercado (PMC CMED). Este é um protótipo de demonstração da Fase 1.
