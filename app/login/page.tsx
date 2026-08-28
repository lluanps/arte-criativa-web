"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { salvarSessao } from "@/lib/auth";
import { AuthResponse, LoginRequest } from "@/types/auth";
import { Button, Card, ErrorBanner, Input, Label, SuccessBanner } from "@/components/ui";
import { IconCandle } from "@/components/Icon";

function LoginForm() {
  const router = useRouter();
  const senhaRedefinida = useSearchParams().get("senha-redefinida") === "1";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await api.post<AuthResponse>("/auth/login", { email, senha } satisfies LoginRequest);
      salvarSessao(resposta);
      router.replace("/");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-sm">
            <IconCandle className="h-8 w-8 text-accent-ink" />
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight text-ink">Arte Criativa</p>
            <p className="text-sm text-ink-secondary">gestão do ateliê</p>
          </div>
        </div>

        <Card>
          <form onSubmit={entrar} className="flex flex-col gap-4">
            {senhaRedefinida && <SuccessBanner mensagem="Senha redefinida! Já pode entrar com a senha nova." />}
            {erro && <ErrorBanner mensagem={erro} />}

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={enviando} className="mt-2 w-full">
              {enviando ? "Entrando..." : "Entrar"}
            </Button>

            <Link href="/esqueci-senha" className="text-center text-sm font-medium text-ink-secondary hover:text-ink">
              Esqueci minha senha
            </Link>
            <Link href="/registrar-empresa" className="text-center text-sm font-medium text-ink-secondary hover:text-ink">
              Ainda não tenho conta — criar empresa
            </Link>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
