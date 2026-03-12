"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const services = [
  {
    title: "ELABORACI\u00D3N DE DICT\u00C1MENES FINANCIEROS",
    image: "/images/dictamen-pericial.jpg",
    items: ["Fotograf\u00EDa", "Documentos con n\u00FAmeros"],
  },
  {
    title: "C\u00C1LCULO DE PERJUICIOS",
    image: "/images/gavel.jpg",
    items: ["Fotograf\u00EDa", "Maso y calculadora"],
  },
  {
    title: "REALIZACI\u00D3N DE LIQUIDACIONES",
    image: "/images/liquidaciones.jpg",
    items: ["Fotograf\u00EDa", "Documento con tabla de n\u00FAmeros"],
  },
];

export default function Services() {
  const ref = useReveal();

  return (
    <section id="servicios" style={{ backgroundColor: "#1a3a7a", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 30px" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 reveal-stagger" style={{ gap: "24px" }}>
          {services.map((service, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ position: "relative", height: "200px" }}>
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  style={{ objectFit: "cover", objectPosition: index === 0 ? "center -10px" : "center top" }}
                />
              </div>
              <div
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "16px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    lineHeight: 1.4,
                  }}
                >
                  {service.title}
                </h3>
                {service.items.map((item, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.8)",
                      lineHeight: 1.6,
                    }}
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
