"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Início" },
  { href: "/estoque", label: "Estoque" },
  { href: "/receitas", label: "Receitas" },
  { href: "/vendas", label: "Vendas" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/tutoriais", label: "Tutoriais" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-6 py-3">
        {links.map((link) => {
          const ativo = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                ativo
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
