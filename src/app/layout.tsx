import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://banco-valor-digital.example"),
  title: {
    default: "Banco Valor Digital — Crédito que gera valor",
    template: "%s · Banco Valor Digital",
  },
  description:
    "Projeto piloto do Banco Valor Digital: uma experiência financeira digital simples, inteligente e construída para acompanhar sua evolução.",
  keywords: ["microcrédito", "fintech", "score", "crédito digital", "Banco Valor Digital"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Banco Valor Digital — Crédito que gera valor",
    description:
      "Projeto piloto de plataforma financeira digital: microcrédito, Score Valor e ciclo de relacionamento.",
    siteName: "Banco Valor Digital",
  },
  twitter: {
    card: "summary_large_image",
    title: "Banco Valor Digital — Crédito que gera valor",
    description: "Projeto piloto de plataforma financeira digital.",
  },
  // Piloto: fora do ar para buscadores enquanto os dados forem demonstrativos.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${inter.variable}`}>
      <body className="bg-ink antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
