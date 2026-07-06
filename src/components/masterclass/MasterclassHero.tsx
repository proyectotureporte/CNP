"use client";

import Image from "next/image";

export interface MasterclassHeroContenido {
  titulo?: string; parrafo?: string; imagen?: string; botonTexto?: string;
}

export default function MasterclassHero({ contenido }: { contenido?: MasterclassHeroContenido }) {
  const c = {
    titulo: contenido?.titulo || "MasterClass Especializadas",
    parrafo: contenido?.parrafo || "Formación de alto nivel para abogados, litigantes y profesionales del sector jurídico y pericial que buscan fortalecer su criterio técnico, dominar la prueba y alcanzar resultados con rigor y excelencia.",
    imagen: contenido?.imagen || "/images/masterclass/hero.webp",
    botonTexto: contenido?.botonTexto || "Reservar cupo",
  };
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, #0a1c40, #0d244f)",
        color: "#ffffff",
      }}
    >
      <div className="mc-hero-glow" aria-hidden="true" />

      <div className="mc-hero-media">
        <Image
          src={c.imagen}
          alt="Profesionales del sector jurídico y pericial analizando documentos financieros"
          fill
          priority
          sizes="(max-width: 780px) 100vw, 52vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div className="mc-hero-copy">
          <h1
            className="mc-fade-up"
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "clamp(34px, 4.4vw, 52px)",
              lineHeight: 1.06,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: "0 0 20px",
            }}
          >
            {c.titulo}
          </h1>
          <p
            className="mc-fade-up mc-delay-1"
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "16px",
              color: "#c6d2e6",
              maxWidth: "480px",
              margin: "0 0 30px",
            }}
          >
            {c.parrafo}
          </p>
          <div
            className="mc-fade-up mc-delay-2"
            style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}
          >
            <a
              href="#reservar"
              className="mc-btn-shine"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                lineHeight: 1,
                padding: "14px 22px",
                borderRadius: "9px",
                backgroundColor: "#2b57bc",
                color: "#ffffff",
                textDecoration: "none",
                boxShadow: "0 10px 22px -12px rgba(43, 87, 188, 0.9)",
                transition: "transform 0.15s ease, background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3061c9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2b57bc";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {c.botonTexto}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </a>

            {/* TODO: activar cuando exista el canal oficial de YouTube de CNP
            <a
              href="https://www.youtube.com/@CANAL_CNP"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                lineHeight: 1,
                padding: "14px 22px",
                borderRadius: "9px",
                backgroundColor: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.45)",
                color: "#ffffff",
                textDecoration: "none",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none" /></svg>
              Ver clases en YouTube
            </a>
            */}
          </div>
        </div>
      </div>
    </section>
  );
}
