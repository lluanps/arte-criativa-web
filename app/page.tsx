import Link from "next/link";

const modulos = [
  { nome: "Estoque", href: "/estoque", descricao: "Produtos, matérias-primas e movimentações" },
  { nome: "Receitas", href: "/receitas", descricao: "Fichas técnicas e registro de produção" },
  { nome: "Vendas", href: "/vendas", descricao: "Pedidos e vendas realizadas" },
  { nome: "Financeiro", href: "/financeiro", descricao: "Lançamentos, contas a pagar e a receber" },
  { nome: "Tutoriais", href: "/tutoriais", descricao: "Passo a passo de produção" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Arte Criativa</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Sistema de gestão para vendas de produtos artesanais.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {modulos.map((modulo) => (
          <Link
            key={modulo.nome}
            href={modulo.href}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
          >
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{modulo.nome}</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{modulo.descricao}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
