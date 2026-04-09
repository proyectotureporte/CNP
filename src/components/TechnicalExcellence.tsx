"use client";

import Image from "next/image";

const cards = [
  {
    icon: "/images/ICONO 7.png",
    title: "Cuantificación de perjuicios",
    desc: "Cálculo técnico de lucro cesante y daño emergente con respaldo metodológico.",
  },
  {
    icon: "/images/ICONO 8.png",
    title: "Revisión de Liquidaciones",
    desc: "Auditoría técnica de préstamos, intereses y estructuras financieras en litigios.",
  },
  {
    icon: "/images/ICONO 9.png",
    title: "Análisis Económico de Incumplimiento",
    desc: "Determinación del impacto financiero derivado de rupturas contractuales.",
  },
  {
    icon: "/images/ICNONO 10.png",
    title: "Valoración de pruebas financieras",
    desc: "Interpretación y análisis de documentos contables complejos para el tribunal.",
  },
  {
    icon: "/images/ICONO 11.png",
    title: "Valoración de pruebas financieras",
    desc: "Análisis crítico y detección de errores técnicos en informes periciales externos.",
  },
  {
    icon: "/images/ICNONO 12.png",
    title: "Segunda Opinión Experta",
    desc: "Validación independiente de la evidencia existente para fortalecer la estrategia probatoria.",
  },
];

export default function TechnicalExcellence() {
  return (
    <section style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif" }}>
      {/* Header band */}
      <div
        style={{
          backgroundColor: "#0d1f4e",
          padding: "48px 60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "40px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "280px" }}>
          <h2
            style={{
              fontSize: "clamp(22px, 3.1vw, 39px)",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            Excelencia técnica en la evaluación de evidencia financiera.
          </h2>
          <p
            style={{
              fontSize: "clamp(21px, 1.8vw, 26px)",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              maxWidth: "1200px",
            }}
          >
            Ayudamos a transformar problemas económicos complejos en pruebas técnicas claras,
            defendibles y cuantificables para procesos legales.
          </p>
        </div>
        <a
          href="#contacto"
          style={{
            display: "inline-block",
            backgroundColor: "#ea580c",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "17px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            padding: "14px 28px",
            borderRadius: "8px",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Solicitar diagnóstico técnico
        </a>
      </div>

      {/* Cards grid */}
      <div
        style={{
          backgroundColor: "#f4f7fb",
          padding: "48px 60px",
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "20px" }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dde6f0",
                borderRadius: "12px",
                padding: "28px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                <Image
                  src={card.icon}
                  alt={card.title}
                  width={88}
                  height={88}
                  style={{ flexShrink: 0 }}
                />
                <h3
                  style={{
                    fontSize: "clamp(22px, 1.8vw, 25px)",
                    fontWeight: 700,
                    color: "#0d1f4e",
                    lineHeight: 1.2,
                  }}
                >
                  {card.title}
                </h3>
              </div>
              <p
                style={{
                  fontSize: "clamp(20px, 1.4vw, 22px)",
                  color: "#4a5568",
                  lineHeight: 1.6,
                }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
