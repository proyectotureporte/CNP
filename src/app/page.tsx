import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import SolucionesClientes from "@/components/SolucionesClientes";
import About from "@/components/About";
import InfoHero from "@/components/InfoHero";
import CasosExito from "@/components/CasosExito";
import AudienceCards from "@/components/AudienceCards";
import Benefits from "@/components/Benefits";
import TechnicalExcellence from "@/components/TechnicalExcellence";
import MiniGuarantee from "@/components/MiniGuarantee";
import ProcessSteps from "@/components/ProcessSteps";
import EnfoqueMetodologia from "@/components/EnfoqueMetodologia";
import Values from "@/components/Values";
import LitigioModerno from "@/components/LitigioModerno";
import QuoteForm from "@/components/QuoteForm";
import Clients from "@/components/Clients";
import NationalOperation from "@/components/NationalOperation";
import Footer from "@/components/Footer";
import { mergeContenido } from "@/lib/content/tipos";
import { DEFAULTS } from "@/lib/content/paginas/home";
import { siteContent } from "@/lib/db";

// Contenido del hero editable desde el panel /santiago.
export const dynamic = "force-dynamic";

export default async function Home() {
  let overrides: Record<string, unknown> | null = null;
  try {
    const row = await siteContent.getSiteContent("cnp", "home");
    overrides = row?.valor ?? null;
  } catch { /* sin overrides: defaults */ }
  const c = mergeContenido(DEFAULTS, overrides);

  return (
    <>
      <SmoothScroll />
      <Header />
      <main style={{ fontFamily: c.estilos.fuente }}>
        <Hero contenido={{ ...c.hero, colorBoton: c.estilos.colorBoton }} />
        <SolucionesClientes />
        <AudienceCards />
        <Benefits
          id="soluciones"
          eyebrow="No solo elaboramos dictámenes:"
          heading="fortalecemos la estrategia probatoria del caso"
          variant="soluciones"
        />
        <TechnicalExcellence />
        <MiniGuarantee />
        <Services />
        <CasosExito />
        <About />
        <EnfoqueMetodologia />
        <InfoHero />
        <Benefits />
        <Values />
        <LitigioModerno />
        <ProcessSteps />
        <QuoteForm />
        <Clients />
        <NationalOperation />
      </main>
      <Footer />
    </>
  );
}
