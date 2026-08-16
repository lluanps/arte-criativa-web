# Arte Criativa — Web

Frontend do sistema de gestão para venda de produtos artesanais (velas, xícaras, etc).

Este repositório cobre só o front. A API (com o roadmap completo dos módulos e o schema do banco) fica em [arte-criativa-api](https://github.com/lluanps/arte-criativa-api).

## Stack

| Camada | Escolha |
|---|---|
| Frontend | Next.js (React) + TypeScript + Tailwind |
| Deploy | Vercel |

## Roadmap

- [x] **Fase 0** — Esqueleto do projeto (Next.js + Tailwind)
- [ ] **Fase 6** — Telas para cada módulo (Estoque, Receitas/Produção, Vendas, Financeiro, Tutoriais), conforme cada um for ficando pronto na API

## Como rodar localmente

Precisa da [API](https://github.com/lluanps/arte-criativa-api) rodando em paralelo (porta 8080).

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Front sobe na porta 3000. A variável `NEXT_PUBLIC_API_URL` (em `.env.local`) aponta pra API.
