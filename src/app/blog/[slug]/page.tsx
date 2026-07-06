import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { blogPost } from "@/lib/db";
import { ARTICULO_CSS } from "../articuloCss";

export const dynamic = "force-dynamic";

function fechaLarga(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

function minutosLectura(html: string): number {
  const palabras = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}

const IconoCalendario = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
);
const IconoReloj = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
);
const IconoAutor = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-.8a7 7 0 0 1 14 0v.8"/></svg>
);
const IconoSoon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
);
const IconoTag = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4L11 3.8A2 2 0 0 0 9.6 3H5a2 2 0 0 0-2 2v4.6c0 .5.2 1 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.6z"/><circle cx="7.5" cy="7.5" r="1.3"/></svg>
);
const IconoFlecha = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
);

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = await blogPost.getBySlug(slug).catch(() => null);
  if (!post) return { title: "Blog · CNP" };
  return {
    title: `${post.titulo} · Blog CNP`,
    description: post.extracto || undefined,
  };
}

export default async function BlogArticuloPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await blogPost.getBySlug(slug).catch(() => null);
  if (!post || !post.publicado || !post.contenidoHtml) notFound();

  const relacionados = await blogPost.listRelacionados(slug, 3).catch(() => []);
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <>
      <Header />
      <style dangerouslySetInnerHTML={{ __html: ARTICULO_CSS }} />
      <div className="blog-cnp">
        {/* Banner del artículo */}
        <section className="abanner">
          <div className="abanner__media">
            {post.imagenUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imagenUrl} alt={post.titulo} />
            )}
          </div>
          <div className="wrap">
            <nav className="crumbs" aria-label="Ruta de navegación">
              <Link href="/">Inicio</Link><span>/</span><Link href="/blog">Blog</Link><span>/</span>{post.categoria}
            </nav>
            <span className="chip">{post.categoria}</span>
            <h1 className="abanner__title">{post.titulo}</h1>
            <div className="abanner__meta">
              <span>{IconoCalendario}{fechaLarga(post.fechaPublicacion)}</span>
              <span>{IconoReloj}{minutosLectura(post.contenidoHtml)} min de lectura</span>
              <span>{IconoAutor}Equipo CNP</span>
            </div>
          </div>
        </section>

        {/* Cuerpo + sidebar */}
        <div className="wrap alayout">
          <article className="article">
            {post.imagenUrl && (
              <div className="article__cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imagenUrl} alt={post.titulo} />
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: post.contenidoHtml }} />
          </article>

          <aside className="sidebar">
            {relacionados.length > 0 && (
              <div className="swidget">
                <h2 className="swidget__title">Artículos relacionados</h2>
                <div className="rel">
                  {relacionados.map((rel) => {
                    const activo = rel.publicado && rel.contenidoHtml;
                    const cuerpo = (
                      <>
                        <div className="rel__thumb">
                          {rel.imagenUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={rel.imagenUrl} alt={rel.titulo} />
                          )}
                        </div>
                        <div>
                          <p className="rel__title">{rel.titulo}</p>
                          {!activo && <span className="soon">{IconoSoon}Próximamente</span>}
                        </div>
                      </>
                    );
                    return activo ? (
                      <Link key={rel._id} href={`/blog/${rel.slug}`} className="rel__item">{cuerpo}</Link>
                    ) : (
                      <div key={rel._id} className="rel__item">{cuerpo}</div>
                    );
                  })}
                </div>
                <Link href="/blog" className="rel__more">Ver todos los artículos{IconoFlecha}</Link>
              </div>
            )}

            {tags.length > 0 && (
              <div className="swidget">
                <h2 className="swidget__title">Palabras clave</h2>
                <div className="tags">
                  {tags.map((tag) => (
                    <span key={tag} className="tag">{IconoTag}{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Banda CTA MasterClasses */}
        <section className="ctaband">
          <div className="wrap ctaband__inner">
            <span className="ctaband__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
            </span>
            <div>
              <p className="ctaband__title">No te pierdas nuestras próximas MasterClasses</p>
              <p className="ctaband__text">Formación especializada para abogados litigantes y profesionales del sector jurídico.</p>
            </div>
            <Link href="/masterclass" className="btn">Ver próximas MasterClasses{IconoFlecha}</Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
