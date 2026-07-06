import type { Metadata } from "next";
import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import Footer from "@/components/Footer";
import QuoteForm from "@/components/QuoteForm";
import MasterclassHero from "@/components/masterclass/MasterclassHero";
import FeaturedMasterclass from "@/components/masterclass/FeaturedMasterclass";
import WhyAttend from "@/components/masterclass/WhyAttend";
import MasterclassBlog, { type BlogPostTarjeta } from "@/components/masterclass/MasterclassBlog";
import { blogPost, siteContent } from "@/lib/db";
import { mergeContenido } from "@/lib/content/tipos";
import { DEFAULTS } from "@/lib/content/paginas/masterclass";

// El apartado Blog se alimenta de la BD (gestionado desde /seguimiento → Blog).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MasterClass Especializadas · CNP + Peritus",
  description:
    "Formación de alto nivel para abogados, litigantes y profesionales del sector jurídico y pericial: rigor probatorio, análisis experto y aplicación práctica. Reserva tu cupo en la próxima MasterClass.",
};

export default async function MasterclassPage() {
  // Máximo 4 tarjetas en pantalla; si la BD falla, la sección sale vacía
  // pero la página sigue funcionando.
  const posts: BlogPostTarjeta[] = await blogPost
    .listParaTarjetas(4)
    .then((rows) =>
      rows.map((p) => ({
        _id: p._id,
        slug: p.slug,
        titulo: p.titulo,
        extracto: p.extracto,
        categoria: p.categoria,
        imagenUrl: p.imagenUrl,
        publicado: p.publicado,
        tieneContenido: Boolean(p.contenidoHtml),
        fechaPublicacion: p.fechaPublicacion,
      })),
    )
    .catch(() => []);

  // Contenido editable desde /santiago (hero, fecha/ponente y por qué asistir)
  let overrides: Record<string, unknown> | null = null;
  try {
    const row = await siteContent.getSiteContent("cnp", "masterclass");
    overrides = row?.valor ?? null;
  } catch { /* sin overrides: defaults */ }
  const c = mergeContenido(DEFAULTS, overrides);

  return (
    <>
      <SmoothScroll />
      <Header />
      <main style={{ fontFamily: c.estilos.fuente }}>
        <MasterclassHero contenido={c.hero} />
        <FeaturedMasterclass contenido={c.destacada} />
        <WhyAttend contenido={c.porQueAsistir} />
        <MasterclassBlog posts={posts} />
        <div id="reservar">
          <QuoteForm origen="masterclass" />
        </div>
      </main>
      <Footer />
    </>
  );
}
