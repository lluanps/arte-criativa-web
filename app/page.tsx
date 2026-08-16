const modulos = [
  { nome: "Estoque", descricao: "Produtos, matérias-primas e movimentações" },
  { nome: "Receitas", descricao: "Fichas técnicas e registro de produção" },
  { nome: "Vendas", descricao: "Pedidos e vendas realizadas" },
  { nome: "Financeiro", descricao: "Lançamentos, contas a pagar e a receber" },
  { nome: "Tutoriais", descricao: "Passo a passo de produção" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">Arte Criativa</h1>
      <p className="mt-2 text-neutral-600">
        Sistema de gestão para vendas de produtos artesanais.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {modulos.map((modulo) => (
          <div
            key={modulo.nome}
            className="rounded-lg border border-neutral-200 p-4 shadow-sm"
          >
            <h2 className="font-semibold">{modulo.nome}</h2>
            <p className="mt-1 text-sm text-neutral-500">{modulo.descricao}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
