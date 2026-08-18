"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconBag, IconBook, IconBox, IconCandle, IconClipboard, IconHome, IconLogOut, IconMenu, IconWallet, IconX } from "@/components/Icon";
import { limparSessao, obterSessao } from "@/lib/auth";

const links = [
  { href: "/", label: "Início", Icon: IconHome },
  { href: "/estoque", label: "Estoque", Icon: IconBox },
  { href: "/receitas", label: "Receitas", Icon: IconClipboard },
  { href: "/vendas", label: "Vendas", Icon: IconBag },
  { href: "/financeiro", label: "Financeiro", Icon: IconWallet },
  { href: "/tutoriais", label: "Tutoriais", Icon: IconBook },
];

/**
 * No mobile a barra lateral vira uma gaveta (fixed + translateX, escondida por
 * padrão) aberta por um botão hambúrguer numa barra de topo compacta. A partir de
 * `lg` ela volta a ser fixa/sempre visível, do jeito que já era — só o `lg:static`
 * tira o `fixed` de cena e ela reentra no fluxo normal do flex do layout.
 */
export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState<string | null>(null);

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  useEffect(() => {
    setNomeUsuario(obterSessao()?.nome ?? null);
  }, [pathname]);

  function sair() {
    limparSessao();
    router.replace("/login");
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-hairline bg-sidebar px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent shadow-sm">
            <IconCandle className="h-5 w-5 text-accent-ink" />
          </div>
          <p className="text-base font-extrabold tracking-tight text-sidebar-ink">Arte Criativa</p>
        </Link>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-ink hover:bg-sidebar-raised"
          aria-label="Abrir menu"
        >
          <IconMenu className="h-6 w-6" />
        </button>
      </header>

      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setAberto(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 -translate-x-full flex-col gap-8 overflow-y-auto bg-sidebar px-4 pb-16 pt-6 transition-transform duration-200 ease-out lg:static lg:z-auto lg:min-h-screen lg:translate-x-0 ${
          aberto ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent shadow-sm">
              <IconCandle className="h-6 w-6 text-accent-ink" />
            </div>
            <div>
              <p className="text-lg font-extrabold leading-tight tracking-tight text-sidebar-ink">Arte Criativa</p>
              <p className="text-sm tracking-wide text-sidebar-ink-muted">gestão do ateliê</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sidebar-ink-muted hover:bg-sidebar-raised hover:text-sidebar-ink lg:hidden"
            aria-label="Fechar menu"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const ativo = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.Icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors ${
                  ativo
                    ? "bg-sidebar-raised text-sidebar-ink before:absolute before:-left-4 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-full before:bg-accent"
                    : "text-sidebar-ink-muted hover:bg-sidebar-raised hover:text-sidebar-ink"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          {nomeUsuario && (
            <div className="flex items-center justify-between gap-2 px-2">
              <p className="truncate text-sm font-semibold text-sidebar-ink-muted">{nomeUsuario}</p>
              <button
                type="button"
                onClick={sair}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sidebar-ink-muted hover:bg-sidebar-raised hover:text-sidebar-ink"
                aria-label="Sair"
                title="Sair"
              >
                <IconLogOut className="h-5 w-5" />
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
