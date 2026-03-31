import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import InnerHero from "@/components/InnerHero";
import InnerContent from "@/components/InnerContent";
import InnerBanner from "@/components/InnerBanner";
import QuoteForm from "@/components/QuoteForm";
import Clients from "@/components/Clients";
import NationalOperation from "@/components/NationalOperation";
import Footer from "@/components/Footer";

const cards = [
  {
    title: "Liquidaciones de Contratos",
    image: "/images/liquidaciones.jpg",
    text: "Ejecutamos liquidaciones de contratos, créditos y obligaciones con precisión contable y plena validez probatoria, garantizando claridad en cada cifra presentada.",
  },
  {
    title: "Valoración de Daños Económicos",
    image: "/images/2.png",
    text: "Valoramos los daños económicos sufridos por su empresa con enfoque financiero y metodología probada, facilitando la reclamación efectiva ante instancias judiciales o arbitrales.",
  },
  {
    title: "Análisis Tributario Especializado",
    image: "/images/3.png",
    text: "Ofrecemos análisis tributario especializado para procesos de fiscalización y controversias con entidades estatales, con sustento técnico sólido y argumentación estratégica.",
  },
];

export default function EmpresasPage() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <InnerHero
          title="Soporte técnico integral para la defensa y protección de su patrimonio."
          subtitle="Acompañamos a empresas del sector real con análisis contable, tributario y económico en sus procesos judiciales, contractuales y de reclamación."
          bgImage="/images/office-meeting.jpg"
        />
        <InnerContent
          sectionTitle="Servicios diseñados para empresas"
          sectionText="CNP ofrece a las empresas el respaldo técnico y pericial necesario para tomar decisiones fundamentadas en controversias judiciales, liquidaciones y procesos de reclamación económica."
          cards={cards}
        />
        <InnerBanner
          title="Proteja el patrimonio de su empresa"
          text="Nuestros expertos están listos para acompañarle en cada etapa del proceso con el rigor técnico y la experiencia que su empresa merece."
        />
        <QuoteForm origen="empresas" />
        <Clients />
        <NationalOperation />
      </main>
      <Footer />
    </>
  );
}
