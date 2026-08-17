import Link from "next/link";
import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";
import { IconAlertTriangle } from "@/components/Icon";

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
    <div className="mb-9 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-ink">{titulo}</h1>
        {descricao && <p className="mt-1.5 text-base text-ink-secondary">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

export function ErrorBanner({ mensagem }: { mensagem: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl bg-critical-soft px-5 py-4 text-base text-critical">
      <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
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

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
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
