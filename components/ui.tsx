import Link from "next/link";
import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";

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
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

export function ErrorBanner({ mensagem }: { mensagem: string }) {
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
      {mensagem}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
      {children}
    </div>
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300 ${props.className ?? ""}`}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-500 dark:[color-scheme:dark] ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 ${props.className ?? ""}`}
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const estilos = {
    primary:
      "bg-neutral-900 text-white hover:bg-neutral-700 disabled:bg-neutral-300 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400",
    secondary: "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
    danger: "border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40",
  };
  return (
    <button
      {...props}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${estilos[variant]} ${className}`}
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
    primary: "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300",
    secondary: "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
  };
  return (
    <Link href={href} className={`inline-block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${estilos[variant]}`}>
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
    default: "text-neutral-900 dark:text-neutral-100",
    success: "text-green-700 dark:text-green-400",
    danger: "text-red-700 dark:text-red-400",
    warning: "text-amber-700 dark:text-amber-400",
  };
  return (
    <Card>
      <p className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${cores[tone]}`}>{valor}</p>
    </Card>
  );
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "danger" | "warning" }) {
  const cores = {
    default: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    success: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cores[tone]}`}>{children}</span>;
}

export function EmptyState({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
      {mensagem}
    </div>
  );
}
