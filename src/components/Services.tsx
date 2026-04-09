"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const services = [
  {
    icon: "/images/3 1.svg",
    title: "Diagnóstico Probatorio-Financiero.",
    description: "Análisis inicial del caso para identificar necesidades técnicas, riesgos y alcances del dictamen pericial.",
  },
  {
    icon: "/images/4 1.svg",
    title: "Informe de Cuantificación de Daños.",
    description: "Cuantificación técnica del daño emergente, lucro cesante y perjuicios económicos.",
  },
  {
    icon: "/images/5 1.svg",
    title: "Valoración del Acervo Probatorio.",
    description: "Análisis técnico de documentos, soportes y evidencias de carácter financiero.",
  },
  {
    icon: "/images/6 1.svg",
    title: "Revisión de Dictamen Contrario.",
    description: "Evaluación crítica del peritaje presentado por la contraparte para detectar errores técnicos.",
  },
  {
    icon: "/images/7 1.svg",
    title: "Segunda Opinión Pericial.",
    description: "Revisión experta para fortalecer la decisión procesal o estratégica del equipo legal.",
  },
  {
    icon: "/images/8 1.svg",
    title: "Acompañamiento Técnico en Litigio.",
    description: "Apoyo experto previo a la audiencia y en etapas críticas del caso.",
  },
];

export default function Services() {
  const ref = useReveal();

  return (
    <section id="servicios" style={{ backgroundColor: "#ffffff", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1500px", margin: "0 auto", padding: "0 30px" }}>

        {/* Header */}
        <div className="reveal" style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2
            style={{
              fontSize: "clamp(20px, 2.8vw, 36px)",
              fontWeight: 800,
              color: "#0d1f4e",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Servicios Probatorios de Alta Especialidad.
          </h2>
          <p
            style={{
              fontSize: "clamp(21px, 1.8vw, 27px)",
              color: "#4a5568",
              lineHeight: 1,
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            Soluciones técnicas diseñadas para blindar su estrategia legal<br />
            con rigor científico y precisión financiera.
          </p>
        </div>

        {/* Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 reveal-stagger"
          style={{ gap: "20px", marginBottom: "48px" }}
        >
          {services.map((service, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dde6f0",
                borderRadius: "12px",
                padding: "36px 24px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "16px",
              }}
            >
              <Image
                src={service.icon}
                alt={service.title}
                width={128}
                height={128}
              />
              <h3
                style={{
                  fontSize: "clamp(20px, 1.6vw, 24px)",
                  fontWeight: 700,
                  color: "#0d1f4e",
                  lineHeight: 1.3,
                }}
              >
                {service.title}
              </h3>
              <p
                style={{
                  fontSize: "clamp(18px, 1.3vw, 20px)",
                  color: "#4a5568",
                  lineHeight: 1.6,
                }}
              >
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <a
            href="#contacto"
            style={{
              display: "inline-block",
              backgroundColor: "#c9a84c",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "clamp(17px, 1.3vw, 20px)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              padding: "16px 48px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Solicitar diagnóstico de caso.
          </a>
        </div>

      </div>
    </section>
  );
}
