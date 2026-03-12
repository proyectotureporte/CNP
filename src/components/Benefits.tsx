"use client";

import { useReveal } from "@/hooks/useReveal";

const benefits = [
  "Precisi\u00F3n en pretensiones y liquidaciones, clave para fortalecer su caso.",
  "Preparaci\u00F3n de interrogatorios con sustento t\u00E9cnico.",
  "An\u00E1lisis t\u00E9cnico de dict\u00E1menes aplicados a procesos judiciales.",
  "Definici\u00F3n de estrategias probatorias que generen ventajas competitivas.",
  "Valoraci\u00F3n del juramento estimatorio con enfoque financiero y probatorio.",
  "Estructuraci\u00F3n de argumentos t\u00E9cnicos que contribuyan a persuadir con claridad.",
];

export default function Benefits() {
  const ref = useReveal();

  return (
    <section id="beneficios" style={{ backgroundColor: "#0d1f4e", padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 30px" }}>
        <h2
          className="reveal"
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "60px",
          }}
        >
          Beneficios de nuestro servicio
        </h2>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 reveal-stagger"
          style={{ gap: "40px 50px" }}
        >
          {benefits.map((benefit, index) => (
            <p
              key={index}
              style={{
                fontSize: "16px",
                color: "rgba(255, 255, 255, 0.9)",
                lineHeight: 1.8,
                textAlign: "center",
              }}
            >
              {benefit}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
