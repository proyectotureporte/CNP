"use client";

import Image from "next/image";

const steps = [
  {
    icon: "/images/10 1.svg",
    title: "Recibimos el caso.",
    description: "Comprendemos el contexto, la etapa procesal y el objetivo probatorio.",
  },
  {
    icon: "/images/11 1.svg",
    title: "Evaluamos la necesidad técnica.",
    description: "Determinamos si se requiere un peritaje, una revisión, una valoración o una estrategia probatoria.",
  },
  {
    icon: "/images/12 1.svg",
    title: "Presentamos el alcance y la metodología.",
    description: "Explicamos qué se hará, cómo y el plazo de entrega.",
  },
  {
    icon: "/images/13 1.svg",
    title: "Realizamos el análisis pericial.",
    description: "Desarrollamos la opinión pericial o la intervención técnica utilizando una metodología estructurada.",
  },
  {
    icon: "/images/14 1.svg",
    title: "Entregamos la evidencia de respaldo.",
    description: "Presentamos conclusiones claras, rastreables y útiles para el éxito del litigio.",
  },
];

export default function ProcessSteps() {
  return (
    <section style={{ backgroundColor: "#ffffff", padding: "80px 0" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "0 40px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2
            style={{
              fontSize: "clamp(31px, 3.9vw, 55px)",
              fontWeight: 800,
              color: "#0d1f4e",
              marginBottom: "16px",
              lineHeight: 1.1,
            }}
          >
            Un proceso claro, técnico y organizado.
          </h2>
          <p
            style={{
              fontSize: "clamp(21px, 1.8vw, 27px)",
              color: "#4a5568",
              lineHeight: 1,
              maxWidth: "820px",
              margin: "0 auto",
            }}
          >
            Seguimos una metodología estructurada para garantizar que cada hallazgo<br />
            técnico se convierta en una prueba irrefutable.
          </p>
        </div>

        {/* Steps row */}
        <div style={{ position: "relative", marginBottom: "52px" }}>

          {/* Línea continua desde centro del círculo 1 hasta centro del círculo 5 */}
          <div style={{
            position: "absolute",
            left: `${100 / steps.length / 2}%`,
            right: `${100 / steps.length / 2}%`,
            top: "24px",
            height: "2px",
            backgroundColor: "#0d1f4e",
          }} />

          {/* Símbolos > entre cada par de círculos */}
          {steps.map((_, index) => index < steps.length - 1 && (
            <div
              key={`gt-${index}`}
              style={{
                position: "absolute",
                left: `${(100 / steps.length) * (index + 1)}%`,
                top: "24px",
                transform: "translate(-50%, -50%)",
                backgroundColor: "#ffffff",
                lineHeight: 1,
              }}
            >
              <span style={{ color: "#0d1f4e", fontSize: "54px", fontWeight: 300, lineHeight: 1, display: "block" }}>{">"}</span>
            </div>
          ))}

          {/* Columnas de pasos */}
          <div style={{ display: "flex" }}>
            {steps.map((step, index) => (
              <div
                key={`step-${index}`}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "0 8px",
                }}
              >
                {/* Número encima de la línea */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#c9a84c",
                    color: "#ffffff",
                    fontSize: "21px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {index + 1}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <Image src={step.icon} alt={step.title} width={144} height={144} />
                </div>

                <h3 style={{ fontSize: "clamp(20px, 1.6vw, 25px)", fontWeight: 700, color: "#0d1f4e", lineHeight: 1.3, marginBottom: "8px" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "clamp(18px, 1.4vw, 21px)", color: "#4a5568", lineHeight: 1.5 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
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
              fontSize: "clamp(16px, 1.2vw, 18px)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              padding: "16px 48px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Solicitar evaluación inicial
          </a>
        </div>

      </div>
    </section>
  );
}
