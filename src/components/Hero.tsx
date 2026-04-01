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
        src="/images/fondo.png"
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
              fontSize: "clamp(20px, 3.8vw, 48px)",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              marginBottom: "24px",
            }}
          >
            Te brindamos la confianza y seguridad necesaria{" "}
            <span style={{ color: "#fbbf24" }}>para tu caso</span>
          </h1>
          <p
            className="reveal-left"
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontSize: "17px",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: 1.8,
              marginBottom: "40px",
              maxWidth: "560px",
            }}
          >
            Transformamos problemas jur&iacute;dicos complejos en an&aacute;lisis
            probatorio claro, defendible y cuantificado
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
              Cont&aacute;ctanos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
