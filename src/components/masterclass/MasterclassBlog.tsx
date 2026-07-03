"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";
import SectionHead from "./SectionHead";

const montserrat = "var(--font-montserrat), Montserrat, sans-serif";

const posts = [
  {
    title: "Anatocismo, intereses de mora y usura: cuando una deuda necesita una revisión técnica",
    excerpt:
      "En un proceso judicial, una liquidación financiera no puede leerse únicamente por el tamaño del saldo final. Un saldo alto puede ser correcto si está bien explicado, soportado y calculado conforme a la ley.",
    image: "/images/masterclass/blog-anatocismo.webp",
    alt: "Anatocismo, intereses de mora y usura",
  },
  {
    title: "El valor del dictamen pericial en juicio",
    excerpt: "Cómo un dictamen sólido puede ser decisivo para respaldar la tesis del caso.",
    image: "/images/masterclass/blog-dictamen-pericial.webp",
    alt: "Dictamen pericial en juicio",
  },
  {
    title: "Errores frecuentes en la prueba técnica",
    excerpt: "Fallos comunes que debilitan la prueba pericial y cómo evitarlos.",
    image: "/images/masterclass/blog-errores-prueba.webp",
    alt: "Errores frecuentes en la prueba técnica",
  },
  {
    title: "Cómo fortalecer la estrategia probatoria",
    excerpt: "Claves para integrar la prueba pericial en una estrategia legal efectiva.",
    image: "/images/masterclass/blog-estrategia-probatoria.webp",
    alt: "Cómo fortalecer la estrategia probatoria",
  },
];

const clamp3: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

export default function MasterclassBlog() {
  const ref = useReveal();

  return (
    <section id="blog" style={{ padding: "8px 0 80px", backgroundColor: "#ffffff" }}>
      <div ref={ref} style={{ width: "100%", maxWidth: "1120px", margin: "0 auto", padding: "0 24px" }}>
        <SectionHead title="Blog" />
        <div className="reveal-stagger grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4" style={{ alignItems: "stretch" }}>
          {posts.map((post) => (
            <article
              key={post.title}
              className="mc-card"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e9ecf2",
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
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
                <Image
                  src={post.image}
                  alt={post.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
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
                  {post.title}
                </h3>
                <p style={{ fontFamily: montserrat, fontSize: "12.5px", color: "#697089", margin: 0, ...clamp3 }}>
                  {post.excerpt}
                </p>
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
