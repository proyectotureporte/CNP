"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const items = [
  {
    icon: "/images/32.svg",
    label: "estructuras financieras complejas",
  },
  {
    icon: "/images/33.svg",
    label: "contratos con impactos económicos significativos",
  },
  {
    icon: "/images/34.svg",
    label: "cálculos de daños",
  },
  {
    icon: "/images/35.svg",
    label: "análisis técnico de información financiera.",
  },
];

export default function LitigioModerno() {
  const ref = useReveal();

  return (
    <section style={{ backgroundColor: "#0d1f4e", padding: "80px 0" }}>
      <div
        ref={ref}
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 40px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "center",
          }}
          className="litigio-grid"
        >
          {/* Columna izquierda */}
          <div className="reveal-left">
            <h2
              style={{
                fontSize: "clamp(31px, 3.52vw, 55px)",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
                marginBottom: "28px",
              }}
            >
              Cuando el litigio requiere soporte técnico, CNP responde con claridad.
            </h2>
            <p
              style={{
                fontSize: "clamp(21px, 1.69vw, 26px)",
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.35,
              }}
            >
              En muchos procedimientos legales, el resultado no depende solo del argumento legal, sino también de la solidez de la evidencia técnica que respalda el reclamo.
            </p>
          </div>

          {/* Columna derecha */}
          <div className="reveal-right">
            <h3
              style={{
                fontSize: "clamp(26px, 2.16vw, 35px)",
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: "28px",
              }}
            >
              El litigio moderno involucra:
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "14px",
                    padding: "28px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: "16px",
                    transition: "background 0.3s ease, border-color 0.3s ease",
                  }}
                  className="litigio-item"
                >
                  <Image src={item.icon} alt={item.label} width={104} height={104} />
                  <span
                    style={{
                      color: "#ffffff",
                      fontSize: "clamp(20px, 1.54vw, 22px)",
                      lineHeight: 1.45,
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
