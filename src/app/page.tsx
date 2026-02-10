import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Benefits from "@/components/Benefits";
import Clients from "@/components/Clients";
import QuoteForm from "@/components/QuoteForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Benefits />
        <Clients />
        <QuoteForm />
      </main>
      <Footer />
    </>
  );
}
