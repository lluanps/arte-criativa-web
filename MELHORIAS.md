# Melhorias futuras

Backlog de ideias levantadas em 2026-08-23, pra não perder o fio enquanto implementamos aos poucos. Marcar `[x]` conforme for entrando; `🔧` = em andamento agora.

## Rápidas de fazer

- [x] **Filtro de categoria no seletor de matéria-prima da Ficha técnica** — hoje é um `<select>` simples com todas as matérias-primas. Reaproveita o cadastro de categoria que já existe. Só frontend, sem depender da API.
- [ ] **Alerta de conta atrasada, como o de estoque baixo** — hoje "contas atrasadas" só aparece como número no dashboard do Financeiro. Um banner tipo o `AlertaEstoqueBaixo` chamando atenção assim que uma conta vence sem ser paga evita esquecer de pagar/cobrar.
- [ ] **Fornecedor virar cadastro de verdade** — hoje é texto livre em cada matéria-prima (sem padronização: "Fornecedor X" ≠ "fornecedor x"). Virando cadastro (tipo Cliente/Canal), dá pra comparar preço do mesmo insumo entre fornecedores ao longo do tempo. Precisa de endpoint novo na API.
- [ ] **Etiqueta / QR code de produto** — gerar e imprimir etiqueta com nome + preço (e QR opcional linkando pro produto) direto da tela de produto, pra facilitar venda física. Só frontend.

## Médias

- [x] **Dashboard na Home** — troca a grade de links por números de verdade: saldo do mês, contas a vencer/atrasadas, estoque baixo, vendas do mês. Reaproveita `DashboardFinanceiroResponse` (já usado em `/financeiro`) e a lógica do `AlertaEstoqueBaixo` (extraída pra `lib/estoque.ts`).
- [ ] **Encomendas com status e prazo (Vendas)** — status do pedido (pendente → em produção → pronto → entregue), data de entrega combinada, agenda/calendário de entregas, e sinal/pagamento parcial.
- [ ] **"Quanto dá pra produzir com o estoque atual"** — pra cada ficha técnica, usando o consumo por unidade já presente em `ReceitaResponse`, calcular quantas unidades dá pra fazer com a matéria-prima em estoque hoje (o item mais escasso limita). Ajuda a planejar produção e a priorizar compra sem abrir calculadora.
- [ ] **Conta recorrente, não só parcelada** — parcelamento cobre "N vezes e acaba" (ex: máquina em 3x). Não cobre conta fixa mensal indefinida (aluguel, internet), que hoje precisa recriar toda vez. Um "repetir todo mês até eu cancelar" resolve.
- [ ] **Comparativo mês a mês no Financeiro** — hoje o dashboard mostra só um período isolado. Gráfico de saldo/receita/despesa dos últimos 6-12 meses mostra tendência (crescendo, encolhendo, sazonal).
- [ ] **Estoque de matéria-prima: giro e ponto de compra** — em vez de alerta binário (abaixo do mínimo ou não), estimar consumo médio pelo histórico de movimentações e sugerir "nesse ritmo, acaba em X dias".
- [ ] **Notificação além da tela** — o alerta de estoque baixo hoje só aparece com alguém logado olhando (client-side, `localStorage`). Reaproveitar a integração já existente com WhatsApp (compartilhar orçamento) pra lembrete proativo: conta a vencer amanhã, encomenda que devia ficar pronta hoje.

## Maiores / estruturais

- [ ] **Testes automatizados + CI** — hoje toda verificação é manual (`mvn compile`/`tsc`/`next build` + teste visual em produção). Não é urgente pro tamanho atual, mas quanto mais o Financeiro cresce em regras (parcelamento, sincronização de lançamento etc.), mais caro fica um bug silencioso passar despercebido.
- [ ] **Log de atividade** — quem criou/editou/excluiu o quê e quando. Hoje são 2 usuários (Luan e Eduarda) sem diferenciação nem histórico — se um valor errado aparecer, não dá pra saber quem mexeu. Fica mais importante se entrar mais gente na operação. Relacionado a multiusuário/permissões abaixo.
- [ ] **Multiusuário / permissões** — hoje é login único sem papéis. Decidir quem vê custo/margem (já escondido por padrão em vendas com o ícone de olho) vs quem só vende.
- [ ] **PWA / uso offline em feira** — instalar como PWA, catálogo de produtos + registro de venda funcionando offline (sincroniza depois), pra não perder venda em evento com internet ruim.
