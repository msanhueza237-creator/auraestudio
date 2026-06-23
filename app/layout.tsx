import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura Estudio - Sistema de Gestión para Peluquería y Belleza",
  description: "Administra tu agenda de citas, clientes, catálogo de servicios, inventario de productos y métricas financieras en tiempo real con Aura Estudio.",
  keywords: ["peluquería", "salón de belleza", "estética", "agenda de citas", "control de stock", "gestión de salón"],
  authors: [{ name: "Aura Estudio Development Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-brand-cream text-brand-dark antialiased">
        {children}
      </body>
    </html>
  );
}
