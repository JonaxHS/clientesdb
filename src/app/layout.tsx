import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClientesDB",
  description: "Gestión de credenciales y domótica de clientes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ClientesDB",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#1E293B" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
