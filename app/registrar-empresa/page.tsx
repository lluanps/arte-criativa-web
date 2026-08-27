"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { salvarSessao } from "@/lib/auth";
import { AuthResponse, RegistroEmpresaRequest } from "@/types/auth";
import { Button, Card, ErrorBanner, Input, Label } from "@/components/ui";
import { IconCandle } from "@/components/Icon";

export default function RegistrarEmpresaPage() {
  const router = useRouter();
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  async function registrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosCampos({});

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);
    try {
      const resposta = await api.post<AuthResponse>("/auth/registrar-empresa", {
        nomeEmpresa,
        nome,
        email,
        senha,
      } satisfies RegistroEmpresaRequest);
      salvarSessao(resposta);
      router.replace("/");
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(e.message);
        setErrosCampos(e.campos ?? {});
      } else {
        setErro("Não foi possível criar a empresa. Tente novamente.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-sm">
            <IconCandle className="h-8 w-8 text-accent-ink" />
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight text-ink">Criar sua empresa</p>
            <p className="text-sm text-ink-secondary">Comece a usar o Arte Criativa no seu ateliê</p>
          </div>
        </div>

        <Card>
          <form onSubmit={registrar} className="flex flex-col gap-4">
            {erro && <ErrorBanner mensagem={erro} />}

            <div>
              <Label htmlFor="nomeEmpresa">Nome da empresa/ateliê</Label>
              <Input
                id="nomeEmpresa"
                autoComplete="organization"
                required
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
              />
              {errosCampos.nomeEmpresa && <p className="mt-1 text-sm text-critical">{errosCampos.nomeEmpresa}</p>}
            </div>

            <div>
              <Label htmlFor="nome">Seu nome</Label>
              <Input id="nome" autoComplete="name" required value={nome} onChange={(e) => setNome(e.target.value)} />
              {errosCampos.nome && <p className="mt-1 text-sm text-critical">{errosCampos.nome}</p>}
            </div>

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
              {errosCampos.email && <p className="mt-1 text-sm text-critical">{errosCampos.email}</p>}
            </div>

            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              {errosCampos.senha && <p className="mt-1 text-sm text-critical">{errosCampos.senha}</p>}
              <p className="mt-1 text-sm text-ink-secondary">Pelo menos 8 caracteres.</p>
            </div>

            <div>
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={enviando} className="mt-2 w-full">
              {enviando ? "Criando..." : "Criar empresa"}
            </Button>

            <Link href="/login" className="text-center text-sm font-medium text-ink-secondary hover:text-ink">
              Já tenho conta — entrar
            </Link>
          </form>
        </Card>
      </div>
    </div>
  );
}
