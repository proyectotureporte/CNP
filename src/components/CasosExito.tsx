"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const cases = [
  {
    title: "Caso de Bancolombia",
    image: "/images/exito1.webp",
    description:
      "Expertos en más de 20 áreas técnicas (ingeniería, medicina, psicología y más). Todo el conocimiento que su caso necesita en un solo lugar.",
  },
  {
    title: "Caso de EMCALI",
    image: "/images/exito2.webp",
    description:
      "Expertos en más de 20 áreas técnicas (ingeniería, medicina, psicología y más). Todo el conocimiento que su caso necesita en un solo lugar.",
  },
  {
    title: "Caso de Bancolombia",
    image: "/images/exito3.webp",
    description:
      "Expertos en más de 20 áreas técnicas (ingeniería, medicina, psicología y más). Todo el conocimiento que su caso necesita en un solo lugar.",
  },
];

export default function CasosExito() {
  const ref = useReveal();

  return (
    <section style={{ backgroundColor: "#ffffff", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 30px" }}>
        <h2
          className="reveal"
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "clamp(24px, 3.5vw, 34px)",
            fontWeight: 800,
            color: "#0a2a6e",
            textAlign: "center",
            marginBottom: "48px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Nuestros Casos de &Eacute;xito
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 reveal-stagger" style={{ gap: "24px" }}>
          {cases.map((c, index) => (
            <div
              key={index}
              style={{
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(10,42,110,0.10)",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* 60% image */}
              <div style={{ position: "relative", flex: "0 0 60%" }}>
                <div style={{ paddingTop: "75%" /* aspect ratio placeholder */ }} />
                <Image
                  src={c.image}
                  alt={c.title}
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>

              {/* 40% text */}
              <div
                style={{
                  padding: "24px 22px",
                  backgroundColor: "#ffffff",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "17px",
                    fontWeight: 800,
                    color: "#0a2a6e",
                    lineHeight: 1.3,
                  }}
                >
                  {c.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#475569",
                    lineHeight: 1.75,
                    textAlign: "justify",
                  }}
                >
                  {c.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
