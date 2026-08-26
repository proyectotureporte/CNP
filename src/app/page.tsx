import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import { CasosExito } from "@/components/home-unificado/CasosExito";
import { AnchorNavigation } from "@/components/home-unificado/AnchorNavigation";
import { Contacto } from "@/components/home-unificado/Contacto";
import { FiltroPerfil } from "@/components/home-unificado/FiltroPerfil";
import { Garantia } from "@/components/home-unificado/Garantia";
import { Hero } from "@/components/home-unificado/Hero";
import { LogoRail } from "@/components/home-unificado/LogoRail";
import { RedPeritus } from "@/components/home-unificado/RedPeritus";
import { SiteFooter } from "@/components/home-unificado/SiteFooter";
import { SiteHeader } from "@/components/home-unificado/SiteHeader";
import "./home-unificado.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cnp.com.co"),
  alternates: { canonical: "/" },
  title: "Centro Nacional de Pruebas — Dictámenes periciales para abogados, firmas y empresas",
  description:
    "Elaboramos dictámenes periciales financieros, médicos, de ingeniería, informáticos, grafológicos e industriales, con metodología declarada y plazo comprometido.",
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://cnp.com.co",
    siteName: "Centro Nacional de Pruebas",
    title: "Centro Nacional de Pruebas — Dictámenes periciales",
    description:
      "Dictámenes periciales para abogados, firmas y empresas. Seis disciplinas en una sola red.",
  },
};

export default function Home() {
  return (
    <div className={`cnp-home ${dmSans.variable} ${sourceSerif.variable}`}>
      <AnchorNavigation />
      <SiteHeader />
      <main>
        <Hero />
        <LogoRail />
        <FiltroPerfil />
        <RedPeritus />
        <CasosExito />
        <Garantia />
        <Contacto />
      </main>
      <SiteFooter />
    </div>
  );
}
