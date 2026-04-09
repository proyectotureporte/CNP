"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

export default function Hero() {
  const ref = useReveal();

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
        src="/images/FONDON.png"
        alt="Background"
        fill
        style={{ objectFit: "cover", objectPosition: "center 45%", transform: "scaleX(-1)" }}
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
            La prueba técnica del litigio: Transformamos casos,<br />
            complejos en análisis probatorio <span style={{ color: "#fbbf24" }}>claro, defendible y<br />
            cuantificado.</span>
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
            Apoyamos a abogados, firmas y empresas con dictámenes financieros, valoración de pruebas
            y estrategia<br />probatoria para litigios y controversias.
          </p>
          <div className="reveal">
            <a
              href="#contacto"
              className="btn-pulse"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "16px",
                fontWeight: 800,
                backgroundColor: "#ea580c",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "16px 40px",
                textDecoration: "none",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Solicitar diagnóstico
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
