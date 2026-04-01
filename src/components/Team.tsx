"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

export default function Team() {
  const ref = useReveal();

  return (
    <section id="equipo" style={{ backgroundColor: "#f0f6ff", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 30px" }}>
        <div className="flex flex-col lg:flex-row" style={{ gap: "50px", alignItems: "center" }}>
          {/* Text column */}
          <div className="w-full lg:w-[55%] reveal-left">
            <h2
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "clamp(28px, 4vw, 36px)",
                fontWeight: 800,
                color: "#0a2a6e",
                marginBottom: "24px",
              }}
            >
              Nuestro equipo
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#333",
                lineHeight: 1.85,
                marginBottom: "32px",
              }}
            >
              Contamos con un equipo altamente calificado en auditor&iacute;a,
              an&aacute;lisis financiero y valoraci&oacute;n de pruebas, que
              apoya la toma de decisiones en controversias judiciales con
              sustento t&eacute;cnico y precisi&oacute;n profesional. Nuestros
              expertos combinan trayectoria acad&eacute;mica y experiencia
              pericial para garantizar dictámenes de la m&aacute;s alta calidad.
            </p>
            <a
              href="#contacto"
              className="btn-pulse"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "15px",
                fontWeight: 800,
                backgroundColor: "#ea580c",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "14px 36px",
                textDecoration: "none",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Conozca al equipo
            </a>
          </div>

          {/* Image column — fondo.png fills the card */}
          <div className="w-full lg:w-[42%] reveal-right">
            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                height: "380px",
              }}
            >
              <Image
                src="/images/ne.png"
                alt="Nuestro equipo"
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
