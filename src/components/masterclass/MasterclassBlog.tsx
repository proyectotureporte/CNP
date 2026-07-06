"use client";

import Image from "next/image";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import SectionHead from "./SectionHead";

const montserrat = "var(--font-montserrat), Montserrat, sans-serif";

export interface BlogPostTarjeta {
  _id: string;
  slug: string;
  titulo: string;
  extracto: string;
  categoria: string;
  imagenUrl: string;
  publicado: boolean;
  tieneContenido: boolean;
  fechaPublicacion: string;
}

const clamp3: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

// Las tarjetas llegan desde la BD (máximo 4 en pantalla). Si un post está
// publicado y tiene contenido, la tarjeta enlaza a /blog/[slug]; si no,
// muestra el badge "Próximamente" como antes.
export default function MasterclassBlog({ posts }: { posts: BlogPostTarjeta[] }) {
  const ref = useReveal();
  const tarjetas = (posts || []).slice(0, 4);

  return (
    <section id="blog" style={{ padding: "8px 0 80px", backgroundColor: "#ffffff" }}>
      <div ref={ref} style={{ width: "100%", maxWidth: "1120px", margin: "0 auto", padding: "0 24px" }}>
        <SectionHead title="Blog" />
        <div className="reveal-stagger grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4" style={{ alignItems: "stretch" }}>
          {tarjetas.map((post) => {
            const activo = post.publicado && post.tieneContenido;
            const tarjeta = (
              <>
                <div
                  className="mc-post-media"
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 10",
                    overflow: "hidden",
                    backgroundColor: "#dfe4ee",
                  }}
                >
                  {post.imagenUrl && (
                    <Image
                      src={post.imagenUrl}
                      alt={post.titulo}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>
                <div style={{ padding: "16px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h3
                    style={{
                      fontFamily: montserrat,
                      fontSize: "14.5px",
                      fontWeight: 700,
                      color: "#1a2540",
                      lineHeight: 1.3,
                      margin: 0,
                      ...clamp3,
                    }}
                  >
                    {post.titulo}
                  </h3>
                  <p style={{ fontFamily: montserrat, fontSize: "12.5px", color: "#697089", margin: 0, ...clamp3 }}>
                    {post.extracto}
                  </p>
                  {/* Fecha de publicación */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontFamily: montserrat,
                      fontSize: "11.5px",
                      color: "#8b93a6",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
                    {fechaCorta(post.fechaPublicacion)}
                  </span>
                  {activo ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "auto",
                        alignSelf: "flex-start",
                        backgroundColor: "#2b57bc",
                        color: "#ffffff",
                        fontFamily: montserrat,
                        fontSize: "11.5px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        padding: "5px 12px",
                        borderRadius: "20px",
                      }}
                    >
                      Leer artículo
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "auto",
                        alignSelf: "flex-start",
                        backgroundColor: "#e6edfa",
                        color: "#8b93a6",
                        fontFamily: montserrat,
                        fontSize: "11.5px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        padding: "5px 11px",
                        borderRadius: "20px",
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                      Próximamente
                    </span>
                  )}
                </div>
              </>
            );

            const estiloTarjeta: React.CSSProperties = {
              backgroundColor: "#ffffff",
              border: "1px solid #e9ecf2",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            };

            return activo ? (
              <Link key={post._id} href={`/blog/${post.slug}`} className="mc-card" style={estiloTarjeta}>
                {tarjeta}
              </Link>
            ) : (
              <article key={post._id} className="mc-card" style={estiloTarjeta}>
                {tarjeta}
              </article>
            );
          })}
        </div>

        {/* Botón para ver todas las entradas */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <Link
            href="/blog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#2b57bc",
              color: "#ffffff",
              fontFamily: montserrat,
              fontSize: "15px",
              fontWeight: 700,
              padding: "14px 26px",
              borderRadius: "10px",
              boxShadow: "0 10px 22px -12px rgba(43,87,188,.9)",
            }}
          >
            Ir al blog
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
