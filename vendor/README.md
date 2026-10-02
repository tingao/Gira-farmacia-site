# vendor/ — dependências servidas localmente

Nada aqui é carregado de CDN. O site funciona offline e não faz requisição a
terceiros ao abrir a página.

| Arquivo | Pacote | Versão | Licença | Origem |
|---|---|---|---|---|
| `xlsx.full.min.js` | SheetJS (build de navegador) | 0.20.3 | Apache-2.0 | `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js` |
| `react.production.min.js` | React (UMD) | 18.3.1 | MIT | `https://unpkg.com/react@18.3.1/umd/react.production.min.js` |
| `react-dom.production.min.js` | ReactDOM (UMD) | 18.3.1 | MIT | `https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js` |
| `phosphor/regular/style.css` | `@phosphor-icons/web` (peso regular) | 2.1.1 | MIT | `https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css` |
| `phosphor/regular/Phosphor.woff2` | idem, arquivo da fonte | 2.1.1 | MIT | mesma pasta `regular/` |
| `fonts/inter.css` + `fonts/inter-latin*.woff2` | Inter (variável, pesos 400 a 700) | v20 | SIL OFL 1.1 | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700` |

## Por que estão aqui

O `support.js` (runtime do Dc) carregaria React e ReactDOM de `unpkg.com`, e o
design system Nocturne importaria a fonte Inter do Google Fonts. Com essas três
dependências externas, qualquer bloqueio de rede (ou uso offline) deixava a
página em branco. Agora o `index.html` carrega React e ReactDOM localmente antes
do runtime, e o runtime encontra `window.React` e nem tenta o CDN.

## Conferência de integridade

As cópias de React e ReactDOM batem com os hashes SRI declarados dentro de
`support.js`:

```
react.production.min.js      sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z
react-dom.production.min.js  sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1
```

Para reconferir:

```bash
printf 'sha384-%s\n' "$(openssl dgst -sha384 -binary vendor/react.production.min.js | openssl base64 -A)"
```

## Ajustes feitos nos arquivos vendorizados

- `phosphor/regular/style.css`: o `@font-face` referencia só o `Phosphor.woff2`
  (as variantes woff, ttf e svg não foram baixadas porque nenhum navegador atual
  precisa delas).
- `fonts/inter.css`: contém apenas os subconjuntos `latin` e `latin-ext`, com as
  URLs apontando para os arquivos locais. Os subconjuntos cirílico, grego e
  vietnamita ficaram de fora.
- `_ds/nocturne-*/styles.css`: o `@import` do Google Fonts virou um comentário; a
  fonte agora entra pelo `vendor/fonts/inter.css`.

## Como atualizar

1. Baixe o arquivo novo da origem indicada na tabela.
2. Se for React ou ReactDOM, confira o hash SRI contra os valores em `support.js`.
3. Se for a fonte Inter, refaça o filtro dos subconjuntos `latin` e `latin-ext`.
4. Rode `npm test` no repositório (a checagem de UI cobre o carregamento da página).
