"use client";

import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";

interface ItemComNome {
  id: number;
  nome: string;
}

/**
 * Select de um cadastro simples (categoria, canal de venda, cliente...) com um atalho
 * "+ novo" que cria o registro inline sem sair do formulário atual — evita obrigar o
 * usuário a ir num cadastro à parte só pra adicionar uma categoria nova, por exemplo.
 */
export function SelectComCriacao<T extends ItemComNome>({
  id,
  itens,
  value,
  onChange,
  onCriar,
  onCriado,
  placeholder = "Selecione...",
  novoPlaceholder = "Nome...",
}: {
  id: string;
  itens: T[];
  value: number | "";
  onChange: (id: number | "") => void;
  onCriar: (nome: string) => Promise<T>;
  onCriado: (item: T) => void;
  placeholder?: string;
  novoPlaceholder?: string;
}) {
  const [criando, setCriando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvarNovo() {
    if (!nomeNovo.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const item = await onCriar(nomeNovo.trim());
      onCriado(item);
      onChange(item.id);
      setNomeNovo("");
      setCriando(false);
    } catch {
      setErro("Não foi possível criar. Tente um nome diferente.");
    } finally {
      setSalvando(false);
    }
  }

  if (criando) {
    return (
      <div className="flex flex-wrap gap-2">
        <Input
          autoFocus
          className="min-w-0 flex-1"
          placeholder={novoPlaceholder}
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              salvarNovo();
            }
            if (e.key === "Escape") {
              setCriando(false);
              setNomeNovo("");
            }
          }}
        />
        <Button type="button" variant="secondary" className="shrink-0" onClick={salvarNovo} disabled={salvando}>
          {salvando ? "..." : "Add"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => {
            setCriando(false);
            setNomeNovo("");
            setErro(null);
          }}
        >
          ✕
        </Button>
        {erro && <p className="mt-1 w-full text-sm text-critical">{erro}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        <Select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">{placeholder}</option>
          {itens.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Select>
      </div>
      <Button type="button" variant="secondary" className="shrink-0" onClick={() => setCriando(true)}>
        + novo
      </Button>
    </div>
  );
}
