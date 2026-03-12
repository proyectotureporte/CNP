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
        src="/images/hero-bg.jpg"
        alt="Background"
        fill
        style={{ objectFit: "cover", objectPosition: "center top", transform: "scaleX(-1)" }}
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
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "60px 30px",
          width: "100%",
        }}
      >
        <div style={{ maxWidth: "620px" }}>
          <h1
            className="reveal-left"
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              marginBottom: "24px",
            }}
          >
            Expertos en dict&aacute;menes financieros.
          </h1>
          <p
            className="reveal-left"
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontSize: "17px",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: 1.8,
              marginBottom: "36px",
              maxWidth: "560px",
            }}
          >
            Acompa&ntilde;amos a jueces, abogados y empresas del sector real con
            an&aacute;lisis contable, tributario y econ&oacute;mico, aportando
            claridad, sustento t&eacute;cnico y confiabilidad en la
            valoraci&oacute;n de la prueba financiera.
          </p>
          <div className="reveal">
            <a
              href="#contacto"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                backgroundColor: "#1a3a7a",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "14px 32px",
                textDecoration: "none",
                letterSpacing: "0.3px",
                transition: "background-color 0.2s ease",
              }}
            >
              Asesor especialista
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
