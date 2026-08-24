import Link from "next/link";
import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";
import { IconAlertTriangle, IconCheckCircle } from "@/components/Icon";

export function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold text-ink">{titulo}</h1>
        {descricao && <p className="mt-1.5 text-base text-ink-secondary">{descricao}</p>}
      </div>
      {acao && <div className="flex flex-wrap items-center gap-3">{acao}</div>}
    </div>
  );
}

export function ErrorBanner({
  mensagem,
  acao,
}: {
  mensagem: string;
  /** Ação opcional (ex: "Recarregar dados" num conflito de edição concorrente). */
  acao?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl bg-critical-soft px-5 py-4 text-base text-critical">
      <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p>{mensagem}</p>
        {acao && (
          <button type="button" onClick={acao.onClick} className="mt-1.5 font-semibold underline hover:no-underline">
            {acao.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function SuccessBanner({ mensagem }: { mensagem: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl bg-good-soft px-5 py-4 text-base text-good">
      <IconCheckCircle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
      {mensagem}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-hairline bg-surface p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`mb-1.5 block text-base font-medium text-ink-secondary ${props.className ?? ""}`}
    />
  );
}

export function Input({ onChange, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  function aoMudar(e: React.ChangeEvent<HTMLInputElement>) {
    // Peculiaridade do React em <input type="number"> controlado: ao digitar "1" num
    // campo que começa em 0, o DOM vira "01" e o React, pra esse tipo de input,
    // decide se corrige comparando os valores como NÚMERO (Number("01") === 1) — acha
    // que não mudou nada e nunca corrige o texto, mesmo o estado já sendo 1. Corrige
    // a mão aqui, uma vez só, pra todo campo numérico do app.
    if (props.type === "number") {
      const bruto = e.target.value;
      const semZerosAEsquerda = bruto.replace(/^0+(?=\d)/, "");
      if (semZerosAEsquerda !== bruto) {
        e.target.value = semZerosAEsquerda;
      }
    }
    onChange?.(e);
  }

  return (
    <input
      {...props}
      onChange={onChange && aoMudar}
      className={`w-full rounded-lg border border-hairline bg-surface px-4 py-2.5 text-base text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-hairline bg-surface px-4 py-2.5 text-base text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${props.className ?? ""}`}
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const estilos = {
    primary: "bg-accent text-accent-ink hover:brightness-105 disabled:opacity-40",
    secondary: "border border-hairline text-ink-secondary hover:bg-surface-hover",
    danger: "border border-critical text-critical hover:bg-critical-soft",
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2.5 text-base font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:shadow-none ${estilos[variant]} ${className}`}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const estilos = {
    primary: "bg-accent text-accent-ink hover:brightness-105",
    secondary: "border border-hairline text-ink-secondary hover:bg-surface-hover",
  };
  return (
    <Link href={href} className={`inline-block rounded-lg px-4 py-2.5 text-base font-semibold shadow-sm transition-colors ${estilos[variant]}`}>
      {children}
    </Link>
  );
}

export function StatCard({
  label,
  valor,
  tone = "default",
}: {
  label: string;
  valor: string;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const cores = {
    default: "text-ink",
    success: "text-good",
    danger: "text-critical",
    warning: "text-warning",
  };
  return (
    <Card>
      <p className="text-sm font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-1.5 text-3xl font-extrabold tabular-figures ${cores[tone]}`}>{valor}</p>
    </Card>
  );
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "danger" | "warning" }) {
  const cores = {
    default: "bg-surface-hover text-ink-secondary",
    success: "bg-good-soft text-good",
    danger: "bg-critical-soft text-critical",
    warning: "bg-warning-soft text-warning",
  };
  return <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${cores[tone]}`}>{children}</span>;
}

export function EmptyState({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline px-5 py-12 text-center text-base text-ink-secondary">
      {mensagem}
    </div>
  );
}

/** Navegação de página (anterior/próxima + "X–Y de Z") pra qualquer listagem paginada
 * pela API — página é 0-indexada (mesma convenção do backend/Spring). */
export function Paginacao({
  pagina,
  totalPaginas,
  totalElementos,
  tamanho,
  onMudarPagina,
}: {
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
  tamanho: number;
  onMudarPagina: (pagina: number) => void;
}) {
  if (totalElementos === 0) return null;

  const inicio = pagina * tamanho + 1;
  const fim = Math.min((pagina + 1) * tamanho, totalElementos);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-secondary">
        {inicio}–{fim} de {totalElementos}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-sm"
          onClick={() => onMudarPagina(pagina - 1)}
          disabled={pagina <= 0}
        >
          Anterior
        </Button>
        <span className="text-sm text-ink-secondary">
          Página {pagina + 1} de {totalPaginas}
        </span>
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-sm"
          onClick={() => onMudarPagina(pagina + 1)}
          disabled={pagina + 1 >= totalPaginas}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
