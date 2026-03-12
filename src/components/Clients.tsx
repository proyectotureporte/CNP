"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const clients = [
  { name: "EMCALI", image: "/images/EMCALI.png" },
  { name: "RUTA N MEDELL\u00CDN", image: "/images/RUTANMEDELLIN.png" },
  { name: "BANCOLOMBIA", image: "/images/bancolombia.png" },
  { name: "METROVIA", image: "/images/METROVIA.png" },
  { name: "DAVIVIENDA", image: "/images/davivienda.png" },
];

export default function Clients() {
  const ref = useReveal();

  // Duplicate for infinite loop
  const doubled = [...clients, ...clients];

  return (
    <section id="clientes" style={{ backgroundColor: "#c8d8eb", padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 30px" }}>
        <h2
          className="reveal"
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 800,
            color: "#0a2a6e",
            textAlign: "center",
            marginBottom: "60px",
          }}
        >
          Confiaron en nosotros
        </h2>

        {/* Gallery carousel */}
        <div style={{ overflow: "hidden" }}>
          <div
            className="animate-slide-clients"
            style={{
              display: "flex",
              gap: "48px",
              width: "max-content",
            }}
          >
            {doubled.map((client, index) => (
              <div
                key={index}
                style={{
                  flexShrink: 0,
                  width: "200px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "200px",
                    height: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <Image
                    src={client.image}
                    alt={client.name}
                    width={180}
                    height={100}
                    style={{ objectFit: "contain", maxHeight: "88px", width: "auto" }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0a2a6e",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {client.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
