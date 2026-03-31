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
    title: "Dictámenes Imparciales",
    image: "/images/1.png",
    text: "Elaboramos dictámenes con rigor técnico e imparcialidad absoluta, diseñados para aportar claridad en la valoración de la prueba financiera y contable en procesos complejos.",
  },
  {
    title: "Valoración Pericial",
    image: "/images/2.png",
    text: "Valoramos pruebas periciales y contra-dictámenes para facilitar la comprensión técnica de aspectos económicos y financieros determinantes en la decisión judicial.",
  },
  {
    title: "Análisis del Juramento Estimatorio",
    image: "/images/3.png",
    text: "Proveemos análisis técnico del juramento estimatorio con enfoque financiero y probatorio de alto rigor, contribuyendo a una valoración objetiva y fundamentada.",
  },
];

export default function JuecesPage() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <InnerHero
          title="Claridad, rigor y sustento técnico para la toma de decisiones judiciales."
          subtitle="Proveemos a jueces y magistrados análisis financiero imparcial y dictámenes periciales de alta precisión técnica para fundamentar cada resolución."
          bgImage="/images/gavel.jpg"
        />
        <InnerContent
          sectionTitle="Auxiliares de la justicia especializados"
          sectionText="CNP actúa como auxiliar de la justicia aportando claridad técnica en aspectos contables, financieros y económicos que resultan determinantes en la valoración probatoria de cada proceso."
          cards={cards}
        />
        <InnerBanner
          title="Claridad técnica al servicio de la justicia"
          text="Estamos disponibles para atender requerimientos judiciales con la celeridad y precisión que cada proceso exige, garantizando imparcialidad y rigor metodológico."
        />
        <QuoteForm origen="jueces" />
        <Clients />
        <NationalOperation />
      </main>
      <Footer />
    </>
  );
}
