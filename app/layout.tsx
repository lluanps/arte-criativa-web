import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arte Criativa",
  description: "Sistema de gestão para vendas de produtos artesanais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
