"use client";

import Image from "next/image";

const items = [
  {
    icon: "/images/16 1.svg",
    title: "Rigor Científico.",
    description: "Análisis basados en métodos estandarizados y verificables.",
  },
  {
    icon: "/images/17 1.svg",
    title: "Claridad de Exposición.",
    description: "Conclusiones diseñadas para ser comprendidas y valoradas por el juez.",
  },
  {
    icon: "/images/18.svg",
    title: "Trazabilidad Completa.",
    description: "Garantizamos la transparencia de cada dato y proceso analítico.",
  },
];

export default function EnfoqueMetodologia() {
  return (
    <section style={{ backgroundColor: "#f8f9fb", padding: "64px 60px" }}>

      <h2
        style={{
          fontSize: "clamp(26px, 3vw, 43px)",
          fontWeight: 800,
          color: "#0d1f4e",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "40px",
        }}
      >
        Enfoque y Metodología.
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "#ffffff",
              borderTop: "8px solid #c9a84c",
              border: "1px solid #dde6f0",
              borderTopWidth: "8px",
              borderTopColor: "#c9a84c",
              borderRadius: "4px",
              padding: "28px 24px 32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(22px, 1.9vw, 28px)",
                fontWeight: 800,
                color: "#0d1f4e",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                lineHeight: 1.2,
              }}
            >
              {item.title}
            </h3>

            <Image
              src={item.icon}
              alt={item.title}
              width={200}
              height={200}
            />

            <p
              style={{
                fontSize: "clamp(25px, 1.9vw, 30px)",
                color: "#4a5568",
                lineHeight: 1.6,
              }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}
