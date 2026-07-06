import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import InnerHero from "@/components/InnerHero";
import InnerContent from "@/components/InnerContent";
import InnerBanner from "@/components/InnerBanner";
import QuoteForm from "@/components/QuoteForm";
import Clients from "@/components/Clients";
import NationalOperation from "@/components/NationalOperation";
import Footer from "@/components/Footer";
import { mergeContenido } from "@/lib/content/tipos";
import { DEFAULTS } from "@/lib/content/paginas/jueces";
import { siteContent } from "@/lib/db";

// Contenido editable desde el panel /santiago (tabla site_content).
export const dynamic = "force-dynamic";

export default async function JuecesPage() {
  let overrides: Record<string, unknown> | null = null;
  try {
    const row = await siteContent.getSiteContent("cnp", "jueces");
    overrides = row?.valor ?? null;
  } catch { /* sin overrides: defaults */ }
  const c = mergeContenido(DEFAULTS, overrides);

  const cards = [
    { title: c.contenido.tarjeta1Titulo, image: c.contenido.tarjeta1Imagen, text: c.contenido.tarjeta1Texto },
    { title: c.contenido.tarjeta2Titulo, image: c.contenido.tarjeta2Imagen, text: c.contenido.tarjeta2Texto },
    { title: c.contenido.tarjeta3Titulo, image: c.contenido.tarjeta3Imagen, text: c.contenido.tarjeta3Texto },
  ];

  return (
    <>
      <SmoothScroll />
      <Header />
      <main style={{ fontFamily: c.estilos.fuente }}>
        <InnerHero
          title={c.hero.titulo}
          subtitle={c.hero.subtitulo}
          bgImage={c.hero.imagen}
          showButtons
          btn1Label={c.hero.boton1}
          btn2Label={c.hero.boton2}
        />
        <InnerContent
          sectionTitle={c.contenido.titulo}
          sectionText={c.contenido.texto}
          cards={cards}
        />
        <InnerBanner title={c.banner.titulo} text={c.banner.texto} />
        <QuoteForm origen="jueces" />
        <Clients />
        <NationalOperation />
      </main>
      <Footer />
    </>
  );
}
