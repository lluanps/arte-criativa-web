"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertaContaAtrasada } from "@/components/AlertaContaAtrasada";
import { AlertaEncomendaAtrasada } from "@/components/AlertaEncomendaAtrasada";
import { AlertaEstoqueBaixo } from "@/components/AlertaEstoqueBaixo";
import { Nav } from "@/components/Nav";
import { obterSessao } from "@/lib/auth";

const ROTAS_PUBLICAS = ["/login", "/esqueci-senha", "/redefinir-senha", "/registrar-empresa"];

/**
 * Decide o "esqueleto" da página com base na rota: nas rotas públicas de auth, não
 * mostra o Nav (não faz sentido antes de logar) e libera direto. Nas demais, exige
 * sessão salva — sem ela, redireciona pra /login antes de renderizar qualquer coisa
 * protegida (evita o "flash" de conteúdo que some logo em seguida).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publica = ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota));
  const [autorizado, setAutorizado] = useState(publica);

  useEffect(() => {
    if (publica) {
      setAutorizado(true);
      return;
    }
    if (!obterSessao()) {
      router.replace("/login");
      return;
    }
    setAutorizado(true);
  }, [pathname, publica, router]);

  if (publica) {
    return <div className="min-w-0 flex-1">{children}</div>;
  }

  if (!autorizado) {
    return null;
  }

  return (
    <>
      <Nav />
      {/* Canto único pros alertas flutuantes — cada um decide sozinho se tem algo pra
          mostrar (retorna null se não), então empilhar aqui não deixa buraco quando só
          um dos dois está ativo. Antes cada alerta tinha seu próprio `fixed` competindo
          pelo mesmo canto; centralizar evita repetir esse tipo de bug. */}
      <div className="fixed inset-x-4 bottom-4 z-[90] flex flex-col gap-4 sm:inset-x-auto sm:right-4 sm:w-96">
        <AlertaContaAtrasada />
        <AlertaEncomendaAtrasada />
        <AlertaEstoqueBaixo />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </>
  );
}
