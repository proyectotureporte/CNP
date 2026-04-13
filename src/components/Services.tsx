"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const services = [
  {
    icon: "/images/3 1.svg",
    title: "Diagnóstico Probatorio-Financiero.",
    description: "Análisis inicial del caso para identificar necesidades técnicas, riesgos y alcance del dictamen pericial.",
  },
  {
    icon: "/images/4 1.svg",
    title: "Informe de Cuantificación de Daños.",
    description: "Cuantificación técnica y soportada del daño material (lucro cesante y daño emergente) y moral.",
  },
  {
    icon: "/images/5 1.svg",
    title: "Valoración del Acervo Probatorio.",
    description: "Análisis técnico de documentos, soportes y evidencias de carácter financiero.",
  },
  {
    icon: "/images/6 1.svg",
    title: "Revisión de Dictamen de Contraparte",
    description: "Participamos en sus discusiones probatorias, aportando elementos técnicos para decisiones previas o dentro del proceso, sin que sea un dictamen, elaboramos conceptos sobre temas específicos.",
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "24px", marginBottom: "48px" }}
        >
          {services.map((service, index) => (
            <div key={index} className="svc-card-wrap" style={{ height: "400px" }}>
              <div className="service-flip-card" style={{ width: "100%", height: "100%" }}>
                <div className="service-flip-inner">

                  {/* ── FRENTE ── */}
                  <div className="service-flip-front">
                    <Image
                      src={service.icon}
                      alt={service.title}
                      width={92}
                      height={92}
                      style={{ flexShrink: 0 }}
                    />

                    <h3
                      style={{
                        fontSize: "clamp(18px, 1.5vw, 21px)",
                        fontWeight: 700,
                        color: "#0d1f4e",
                        lineHeight: 1.3,
                      }}
                    >
                      {service.title}
                    </h3>

                    {/* Gold divider */}
                    <div
                      style={{
                        width: "48px",
                        height: "3px",
                        borderRadius: "2px",
                        background: "linear-gradient(90deg, #c9a84c, #e8c96a)",
                        flexShrink: 0,
                      }}
                    />

                    <p
                      style={{
                        fontSize: "clamp(17px, 1.43vw, 20px)",
                        color: "#64748b",
                        lineHeight: 1.65,
                      }}
                    >
                      {service.description}
                    </p>

                    {/* Hover hint */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#ea580c",
                          letterSpacing: "0.6px",
                          textTransform: "uppercase",
                        }}
                      >
                        Solicitar servicio
                      </span>
                      <span className="service-hint" style={{ color: "#ea580c", fontSize: "14px" }}>
                        →
                      </span>
                    </div>
                  </div>

                  {/* ── REVERSO (igual a tarjetas.png) ── */}
                  <div className="service-flip-back">
                    {/* Gold top accent */}
                    <div
                      style={{
                        width: "56px",
                        height: "4px",
                        borderRadius: "2px",
                        background: "linear-gradient(90deg, #c9a84c, #e8c96a)",
                        flexShrink: 0,
                      }}
                    />

                    <h3
                      style={{
                        fontSize: "clamp(17px, 1.5vw, 20px)",
                        fontWeight: 800,
                        color: "#ffffff",
                        lineHeight: 1.3,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {service.title}
                    </h3>

                    <p
                      style={{
                        fontSize: "clamp(18px, 1.43vw, 21px)",
                        color: "#cbd5e1",
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                    >
                      ¿Quieres solicitar este servicio?
                    </p>

                    <a
                      href="#contacto"
                      className="service-cta-btn"
                      style={{
                        display: "inline-block",
                        backgroundColor: "#ea580c",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "clamp(18px, 1.43vw, 21px)",
                        padding: "13px 36px",
                        borderRadius: "50px",
                        textDecoration: "none",
                        letterSpacing: "0.4px",
                        boxShadow: "0 6px 24px rgba(234, 88, 12, 0.4)",
                      }}
                    >
                      Hablar con un agente
                    </a>
                  </div>

                </div>
              </div>
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
