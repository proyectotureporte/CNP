"use client";

import { Target, MessageSquare, FileSearch, TrendingUp, Scale, Layers } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const benefits = [
  {
    icon: Target,
    text: "Precisi\u00F3n en pretensiones y liquidaciones, clave para fortalecer su caso.",
  },
  {
    icon: MessageSquare,
    text: "Preparaci\u00F3n de interrogatorios con sustento t\u00E9cnico.",
  },
  {
    icon: FileSearch,
    text: "An\u00E1lisis t\u00E9cnico de dict\u00E1menes aplicados a procesos judiciales.",
  },
  {
    icon: TrendingUp,
    text: "Definici\u00F3n de estrategias probatorias que generen ventajas competitivas.",
  },
  {
    icon: Scale,
    text: "Valoraci\u00F3n del juramento estimatorio con enfoque financiero y probatorio.",
  },
  {
    icon: Layers,
    text: "Estructuraci\u00F3n de argumentos t\u00E9cnicos que contribuyan a persuadir con claridad.",
  },
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
          {benefits.map(({ icon: Icon, text }, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={24} color="#7eb8f7" strokeWidth={1.5} />
              </div>
              <p
                style={{
                  fontSize: "16px",
                  color: "rgba(255, 255, 255, 0.9)",
                  lineHeight: 1.8,
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
