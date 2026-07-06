import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { blogPost } from "@/lib/db";
import { ARTICULO_CSS } from "./articuloCss";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog · CNP",
  description:
    "Análisis financiero, prueba pericial y actualidad técnico-jurídica del Centro Nacional de Pruebas.",
};

function fechaLarga(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

const IconoSoon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
);

export default async function BlogIndexPage() {
  const posts = await blogPost.listTodos().catch(() => []);

  return (
    <>
      <Header />
      <style dangerouslySetInnerHTML={{ __html: ARTICULO_CSS }} />
      <div className="blog-cnp">
        <section className="abanner" style={{ paddingBottom: 56 }}>
          <div className="wrap">
            <nav className="crumbs" aria-label="Ruta de navegación">
              <Link href="/">Inicio</Link><span>/</span>Blog
            </nav>
            <span className="chip">Blog CNP</span>
            <h1 className="abanner__title">Todas las entradas</h1>
            <div className="abanner__meta">
              <span>Análisis financiero, prueba pericial y actualidad técnico-jurídica.</span>
            </div>
          </div>
        </section>

        <section className="related" style={{ paddingTop: 40 }}>
          <div className="wrap">
            {posts.length === 0 ? (
              <p style={{ textAlign: "center", color: "#697089" }}>Aún no hay entradas publicadas.</p>
            ) : (
              <div className="related__grid">
                {posts.map((post) => {
                  const activo = post.publicado && post.contenidoHtml;
                  const tarjeta = (
                    <>
                      <div className="post__media">
                        {post.imagenUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.imagenUrl} alt={post.titulo} />
                        )}
                      </div>
                      <div className="post__body">
                        <span className="post__chip">{post.categoria}</span>
                        <h3 className="post__title">{post.titulo}</h3>
                        <p className="post__excerpt">{post.extracto}</p>
                        <p style={{ fontSize: 12, color: "#8b93a6" }}>{fechaLarga(post.fechaPublicacion)}</p>
                        {!activo && <span className="soon">{IconoSoon}Próximamente</span>}
                      </div>
                    </>
                  );
                  return activo ? (
                    <Link key={post._id} href={`/blog/${post.slug}`} className="post">{tarjeta}</Link>
                  ) : (
                    <article key={post._id} className="post">{tarjeta}</article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
