import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Team from "@/components/Team";
import InfoHero from "@/components/InfoHero";
import CasosExito from "@/components/CasosExito";
import AudienceCards from "@/components/AudienceCards";
import Benefits from "@/components/Benefits";
import TechnicalExcellence from "@/components/TechnicalExcellence";
import MiniGuarantee from "@/components/MiniGuarantee";
import ProcessSteps from "@/components/ProcessSteps";
import EnfoqueMetodologia from "@/components/EnfoqueMetodologia";
import Values from "@/components/Values";
import QuoteForm from "@/components/QuoteForm";
import Clients from "@/components/Clients";
import NationalOperation from "@/components/NationalOperation";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
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
        <ProcessSteps />
        <CasosExito />
        <About />
        <Team />
        <EnfoqueMetodologia />
        <InfoHero />
        <Benefits />
        <Values />
        <QuoteForm />
        <Clients />
        <NationalOperation />
      </main>
      <Footer />
    </>
  );
}
