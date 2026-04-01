import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Team from "@/components/Team";
import InfoHero from "@/components/InfoHero";
import CasosExito from "@/components/CasosExito";
import AudienceCards from "@/components/AudienceCards";
import Benefits from "@/components/Benefits";
import Values from "@/components/Values";
import QuoteForm from "@/components/QuoteForm";
import Clients from "@/components/Clients";
import NationalOperation from "@/components/NationalOperation";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <AudienceCards />
        <Services />
        <About />
        <Team />
        <InfoHero />
        <CasosExito />
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
