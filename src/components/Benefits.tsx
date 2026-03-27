"use client";

import { Target, MessageSquare, FileSearch, TrendingUp, Scale, Layers } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const benefits = [
  {
    icon: Target,
    text: "Precisi\u00F3n en pretensiones y liquidaciones, clave para fortalecer su caso.",
    delay: "0s",
  },
  {
    icon: MessageSquare,
    text: "Preparaci\u00F3n de interrogatorios con sustento t\u00E9cnico.",
    delay: "0.4s",
  },
  {
    icon: FileSearch,
    text: "An\u00E1lisis t\u00E9cnico de dict\u00E1menes aplicados a procesos judiciales.",
    delay: "0.8s",
  },
  {
    icon: TrendingUp,
    text: "Definici\u00F3n de estrategias probatorias que generen ventajas competitivas.",
    delay: "1.2s",
  },
  {
    icon: Scale,
    text: "Valoraci\u00F3n del juramento estimatorio con enfoque financiero y probatorio.",
    delay: "1.6s",
  },
  {
    icon: Layers,
    text: "Estructuraci\u00F3n de argumentos t\u00E9cnicos que contribuyan a persuadir con claridad.",
    delay: "2.0s",
  },
];

export default function Benefits() {
  const ref = useReveal();

  return (
    <section
      id="beneficios"
      style={{
        background: "linear-gradient(160deg, #060f2e 0%, #0d1f4e 50%, #0a1840 100%)",
        padding: "100px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(126,184,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(126,184,247,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 30px", position: "relative", zIndex: 1 }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "64px" }}>
          <p
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#7eb8f7",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            ¿Por qué elegirnos?
          </p>
          <h2
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            Beneficios de nuestro servicio
          </h2>
          <div
            style={{
              width: "60px",
              height: "4px",
              background: "linear-gradient(90deg, #ea580c, #fbbf24)",
              borderRadius: "2px",
              margin: "20px auto 0",
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 reveal-stagger" style={{ gap: "24px" }}>
          {benefits.map(({ icon: Icon, text, delay }, index) => (
            <div
              key={index}
              className="benefit-card"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(126,184,247,0.15)",
                borderRadius: "16px",
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                textAlign: "center",
              }}
            >
              <div
                className="benefit-icon"
                style={{
                  animationDelay: delay,
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(126,184,247,0.2), rgba(234,88,12,0.12))",
                  border: "1.5px solid rgba(126,184,247,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={28} color="#7eb8f7" strokeWidth={1.6} />
              </div>

              <p
                style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.88)",
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
