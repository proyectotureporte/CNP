import type { Metadata } from "next";
import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import Footer from "@/components/Footer";
import QuoteForm from "@/components/QuoteForm";
import MasterclassHero from "@/components/masterclass/MasterclassHero";
import FeaturedMasterclass from "@/components/masterclass/FeaturedMasterclass";
import WhyAttend from "@/components/masterclass/WhyAttend";
import MasterclassBlog from "@/components/masterclass/MasterclassBlog";

export const metadata: Metadata = {
  title: "MasterClass Especializadas · CNP + Peritus",
  description:
    "Formación de alto nivel para abogados, litigantes y profesionales del sector jurídico y pericial: rigor probatorio, análisis experto y aplicación práctica. Reserva tu cupo en la próxima MasterClass.",
};

export default function MasterclassPage() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>
        <MasterclassHero />
        <FeaturedMasterclass />
        <WhyAttend />
        <MasterclassBlog />
        <div id="reservar">
          <QuoteForm origen="masterclass" />
        </div>
      </main>
      <Footer />
    </>
  );
}
