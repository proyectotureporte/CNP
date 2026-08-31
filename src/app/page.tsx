import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import { AnchorNavigation } from '@/components/home-unificado/AnchorNavigation';
import { CasosExito } from '@/components/home-unificado/CasosExito';
import { Clientes } from '@/components/home-unificado/Clientes';
import { Contacto } from '@/components/home-unificado/Contacto';
import { Garantia } from '@/components/home-unificado/Garantia';
import { Hero } from '@/components/home-unificado/Hero';
import { Metodologia } from '@/components/home-unificado/Metodologia';
import { Nosotros } from '@/components/home-unificado/Nosotros';
import { RedPeritus } from '@/components/home-unificado/RedPeritus';
import { SiteFooter } from '@/components/home-unificado/SiteFooter';
import { SiteHeader } from '@/components/home-unificado/SiteHeader';
import { Trabajos } from '@/components/home-unificado/Trabajos';
import './home-unificado.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cnp.com.co'),
  alternates: { canonical: '/' },
  title: 'Centro Nacional de Pruebas — Dictámenes periciales para abogados, firmas y empresas',
  description:
    'Dictámenes periciales para litigio, con metodología declarada y plazo comprometido antes de empezar. Especialidad financiera y contable, y una red de peritos en medicina, ingeniería, informática, grafología e industria. Operación nacional.',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://cnp.com.co',
    siteName: 'Centro Nacional de Pruebas',
    title: 'Centro Nacional de Pruebas — Dictámenes periciales',
    description:
      'Dictámenes periciales para abogados, firmas y empresas. Seis disciplinas en una sola red.',
  },
};

export default function Home() {
  return (
    <div className={`cnp-home ${dmSans.variable} ${sourceSerif.variable} ${mono.variable}`}>
      <AnchorNavigation />
      <SiteHeader />
      <main>
        <Hero />
        <Clientes />
        <Trabajos />
        <Metodologia />
        <RedPeritus />
        <CasosExito />
        <Nosotros />
        <Garantia />
        <Contacto />
      </main>
      <SiteFooter />
    </div>
  );
}
