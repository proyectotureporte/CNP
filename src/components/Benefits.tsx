"use client";

import Image from "next/image";
import { Target, MessageSquare, FileSearch, TrendingUp, Scale, Layers, LucideIcon } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

type BenefitItem =
  | { type: "icon"; icon: LucideIcon; text: string; delay: string }
  | { type: "img"; src: string; text: string; delay: string };

const defaultBenefits: BenefitItem[] = [
  { type: "icon", icon: Target,        text: "Precisión en pretensiones y liquidaciones, clave para fortalecer su caso.", delay: "0s" },
  { type: "icon", icon: MessageSquare, text: "Preparación de interrogatorios con sustento técnico.",                     delay: "0.4s" },
  { type: "icon", icon: FileSearch,    text: "Análisis técnico de dictámenes aplicados a procesos judiciales.",          delay: "0.8s" },
  { type: "icon", icon: TrendingUp,    text: "Definición de estrategias probatorias que generen ventajas competitivas.", delay: "1.2s" },
  { type: "icon", icon: Scale,         text: "Valoración del juramento estimatorio con enfoque financiero y probatorio.", delay: "1.6s" },
  { type: "icon", icon: Layers,        text: "Estructuración de argumentos técnicos que contribuyan a persuadir con claridad.", delay: "2.0s" },
];

const solucionesBenefits: BenefitItem[] = [
  { type: "img", src: "/images/ICONO 1.png", text: "Rigor técnico",              delay: "0s" },
  { type: "img", src: "/images/ICONO 2.png", text: "Metodología estructurada",   delay: "0.4s" },
  { type: "img", src: "/images/ICONO 3.png", text: "Respuesta ágil",             delay: "0.8s" },
  { type: "img", src: "/images/ICONO 4.png", text: "Enfoque probatorio",         delay: "1.2s" },
  { type: "img", src: "/images/ICONO 5.png", text: "Expertos especializados",    delay: "1.6s" },
  { type: "img", src: "/images/ICONO 6.png", text: "Acompañamiento Integral",    delay: "2.0s" },
];

interface BenefitsProps {
  id?: string;
  eyebrow?: string;
  heading?: string;
  variant?: "default" | "soluciones";
}

export default function Benefits({
  id = "beneficios",
  eyebrow = "¿Por qué elegirnos?",
  heading = "Beneficios de nuestro servicio",
  variant = "default",
}: BenefitsProps) {
  const ref = useReveal();
  const items = variant === "soluciones" ? solucionesBenefits : defaultBenefits;
  const cardTextSize = variant === "default" ? "1.51rem" : "2.8rem";

  return (
    <section
      id={id}
      style={{
        background: "linear-gradient(160deg, #060f2e 0%, #0d1f4e 50%, #0a1840 100%)",
        padding: "100px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
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
            {eyebrow}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            {heading}
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
          {items.map((item, index) => (
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
                  animationDelay: item.delay,
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(126,184,247,0.2), rgba(234,88,12,0.12))",
                  border: "1.5px solid rgba(126,184,247,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.type === "img" ? (
                  <Image src={item.src} alt={item.text} width={47} height={47} />
                ) : (
                  <item.icon size={36} color="#7eb8f7" strokeWidth={1.6} />
                )}
              </div>

              <p
                style={{
                  fontSize: cardTextSize,
                  color: "rgba(255,255,255,0.88)",
                  lineHeight: 1,
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
