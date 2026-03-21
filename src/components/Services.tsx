"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const services = [
  {
    title: "ELABORACI\u00D3N DE DICT\u00C1MENES FINANCIEROS",
    image: "/images/1.png",
  },
  {
    title: "C\u00C1LCULO DE PERJUICIOS",
    image: "/images/2.png",
  },
  {
    title: "REALIZACI\u00D3N DE LIQUIDACIONES",
    image: "/images/3.png",
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
