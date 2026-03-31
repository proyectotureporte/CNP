"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const services = [
  {
    title: "ELABORACI\u00D3N DE DICT\u00C1MENES FINANCIEROS",
    image: "/images/1.png",
    description:
      "Análisis técnico de información financiera para litigios y controversias.",
  },
  {
    title: "C\u00C1LCULO DE PERJUICIOS",
    image: "/images/2.png",
    description:
      "Cuantificación técnica de daño emergente, lucro cesante y afectaciones económicas.",
  },
  {
    title: "REALIZACI\u00D3N DE LIQUIDACIONES",
    image: "/images/3.png",
    description:
      "Revisión técnica, estructuración y validación económica de liquidaciones e incumplimientos contractuales.",
  },
];

export default function Services() {
  const ref = useReveal();

  return (
    <section id="servicios" style={{ backgroundColor: "#1a3a7a", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 30px" }}>
        {/* Section title */}
        <h2
          className="reveal"
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "clamp(22px, 3.5vw, 32px)",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginBottom: "48px",
          }}
        >
          Nuestros Servicios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 reveal-stagger" style={{ gap: "24px" }}>
          {services.map((service, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Image with hover overlay */}
              <div className="service-img-wrap" style={{ height: "220px" }}>
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: index === 0 ? "center -10px" : "center top",
                  }}
                />
                <div className="service-overlay">
                  <svg
                    width="36"
                    height="36"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#fbbf24"
                    strokeWidth={1.8}
                    style={{ marginBottom: "14px", flexShrink: 0 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                  </svg>
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: "14px",
                      color: "#ffffff",
                      lineHeight: 1.7,
                    }}
                  >
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div
                style={{
                  padding: "28px 24px",
                  textAlign: "center",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    lineHeight: 1.4,
                  }}
                >
                  {service.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
