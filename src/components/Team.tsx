"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

export default function Team() {
  const ref = useReveal();

  return (
    <section id="equipo" style={{ backgroundColor: "#f0f6ff", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1500px", margin: "0 auto", padding: "0 60px" }}>
        <div className="flex flex-col lg:flex-row" style={{ gap: "50px", alignItems: "center" }}>
          {/* Text column */}
          <div className="w-full lg:w-[65%] reveal-left">
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
                fontSize: "23px",
                color: "#333",
                lineHeight: 1.85,
                marginBottom: "32px",
                textAlign: "justify",
              }}
            >
              Nuestro equipo de expertos convierte información financiera compleja en dictámenes claros y comprensibles, facilitando la valoración de la prueba y fortaleciendo la toma de decisiones dentro del litigio.
              <br /><br />
              En CNP contribuimos a que las decisiones jurídicas se fundamenten en análisis técnico sólido, evidencia confiable y rigor profesional.
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
          <div className="w-full lg:w-[32%] reveal-right">
            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                height: "468px",
              }}
            >
              <Image
                src="/images/ne.jpg"
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
