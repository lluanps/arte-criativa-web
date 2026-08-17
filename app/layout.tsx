import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-paper text-ink lg:flex-row">
        <ThemeProvider>
          <Nav />
          <div className="min-w-0 flex-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
