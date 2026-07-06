"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

export interface HeroContenido {
  imagen?: string;
  titulo1?: string;
  tituloAcento?: string;
  titulo2?: string;
  colorAcento?: string;
  parrafo?: string;
  boton1Texto?: string;
  boton2Texto?: string;
  colorBoton?: string;
}

export default function Hero({ contenido }: { contenido?: HeroContenido }) {
  const ref = useReveal();
  const c = {
    imagen: contenido?.imagen || "/images/herologo.png",
    titulo1: contenido?.titulo1 || "Prueba técnica para el litigio: Transformamos casos complejos en",
    tituloAcento: contenido?.tituloAcento || "dictámenes claros, comprensibles y sustentables",
    titulo2: contenido?.titulo2 || "ante el juez",
    colorAcento: contenido?.colorAcento || "#fbbf24",
    parrafo: contenido?.parrafo || "Apoyamos a abogados, firmas y empresas en la elaboración de dictámenes financieros especializados, valoración técnica de pruebas, estrategia probatoria para litigio",
    boton1Texto: contenido?.boton1Texto || "Solicitar diagnóstico",
    boton2Texto: contenido?.boton2Texto || "Solicitar Dictamen Pericial",
    colorBoton: contenido?.colorBoton || "#ea580c",
  };

  return (
    <section
      id="inicio"
      style={{
        position: "relative",
        height: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Image
  src={c.imagen}
  alt="Background"
  fill
  style={{ objectFit: "cover", objectPosition: "top"}}
  priority
/>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(10, 42, 110, 0.70)",
        }}
      />

      <div
        ref={ref}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "60px 0",
        }}
      >
        <div style={{ width: "90%" }}>
          <h1
            className="reveal-left"
            style={{
              fontFamily: "var(--font-oswald), Oswald, sans-serif",
              fontSize: "clamp(24px, 4.1vw, 56px)",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.3,
              marginBottom: "24px",
            }}
          >
            {c.titulo1}{" "}
             <span style={{ color: c.colorAcento }}>{c.tituloAcento}
            </span> {c.titulo2}
          </h1>
          <p
            className="reveal-left"
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontSize: "clamp(1.06rem, 1.45vw, 1.36rem)",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: 1.8,
              marginBottom: "40px",
            }}
          >
            {c.parrafo}
          </p>
          <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: "28px" }}>
            <a
              href="#contacto"
              className="btn-pulse"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "16px",
                fontWeight: 800,
                backgroundColor: c.colorBoton,
                color: "#ffffff",
                borderRadius: "10px",
                padding: "16px 40px",
                textDecoration: "none",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              {c.boton1Texto}
            </a>
            <a
              href="#contacto"
              className="btn-pulse"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "16px",
                fontWeight: 800,
                backgroundColor: c.colorBoton,
                color: "#ffffff",
                borderRadius: "10px",
                padding: "16px 40px",
                textDecoration: "none",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              {c.boton2Texto}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
