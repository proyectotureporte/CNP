import type { Metadata } from "next";
import { Open_Sans, Quicksand, Montserrat, Oswald } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-quicksand",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "Centro Nacional de Pruebas - Somos expertos en Derecho Financiero",
  description:
    "Realizamos minuciosos cálculos financieros y acompañamiento que le permitirán ventajas competitivas en el tramite del proceso. Realizamos: Dictamen Pericial, Acompañamientos a Audiencia, Calculo de Perjuicios y Liquidaciones.",
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${oswald.className} ${oswald.variable} ${quicksand.variable} ${montserrat.variable}`}>
        {children}
      </body>
    </html>
  );
}
