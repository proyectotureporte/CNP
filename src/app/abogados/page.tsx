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
    title: "Dictámenes Periciales",
    image: "/images/1.png",
    text: "Elaboramos dictámenes con plena validez probatoria para respaldar sus pretensiones en procesos judiciales y arbitrales, con rigor técnico y trazabilidad metodológica.",
  },
  {
    title: "Cálculo de Perjuicios",
    image: "/images/2.png",
    text: "Cuantificamos lucro cesante, daño emergente y perjuicios morales con metodología técnica rigurosa, aportando solidez numérica a cada pretensión económica del proceso.",
  },
  {
    title: "Estrategia Probatoria",
    image: "/images/3.png",
    text: "Definimos junto a usted la estrategia probatoria que genere ventajas competitivas, estructurando argumentos técnicos que contribuyan a persuadir con claridad y precisión.",
  },
];

export default function AbogadosPage() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <InnerHero
          title="No improvise la prueba técnica. Fortalecemos su teoría del caso."
          subtitle="Aportamos sustento financiero y pericial para fortalecer cada pretensión de su caso con precisión, rigor y credibilidad técnica."
          bgImage="/images/lawyers-office.jpg"
        />
        <InnerContent
          sectionTitle="Cómo fortalecemos su práctica jurídica"
          sectionText="En CNP acompañamos a abogados litigantes con dictámenes, cálculos y análisis que aportan la precisión técnica que sus casos necesitan para prosperar en cualquier instancia judicial o arbitral."
          cards={cards}
        />
        <InnerBanner
          title="¿Listo para fortalecer su caso?"
          text="Contáctenos hoy y uno de nuestros expertos analizará su situación sin costo inicial. Estamos disponibles para responder con la celeridad que su proceso exige."
        />
        <QuoteForm origen="abogados" />
        <Clients />
        <NationalOperation />
      </main>
      <Footer />
    </>
  );
}
