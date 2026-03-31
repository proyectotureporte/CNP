"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const clients = [
  { name: "EMCALI", image: "/images/EMCALI.png", large: false },
  { name: "RUTA N MEDELL\u00CDN", image: "/images/RUTANMEDELLIN.png", large: false },
  { name: "BANCOLOMBIA", image: "/images/bancolombia.png", large: false },
  { name: "METROVIA", image: "/images/METROVIA.png", large: false },
  { name: "DAVIVIENDA", image: "/images/davivienda.png", large: false },
  { name: "LOGON", image: "/images/LOGON.png", large: true },
  { name: "LOGON1", image: "/images/LOGON1.png", large: true },
  { name: "LOGON2", image: "/images/LOGON2.png", large: true },
  { name: "LOGON3", image: "/images/LOGON3.png", large: true },
];

// Triple for seamless loop
const row1 = [...clients, ...clients, ...clients];

export default function Clients() {
  const ref = useReveal();

  return (
    <section
      id="clientes"
      style={{
        background: "linear-gradient(160deg, #07152e 0%, #0d1f4e 60%, #07152e 100%)",
        padding: "100px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      <div ref={ref} style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div className="reveal" style={{ textAlign: "center", marginBottom: "64px", padding: "0 30px" }}>
          <p
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#7eb8f7",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            Empresas que nos respaldan
          </p>
          <h2
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: "20px",
            }}
          >
            Confiaron en nosotros
          </h2>
          <div
            style={{
              width: "70px",
              height: "4px",
              background: "linear-gradient(90deg, #ea580c, #fbbf24)",
              borderRadius: "2px",
              margin: "0 auto",
            }}
          />
        </div>

        {/* Row — left to right */}
        <div
          className="clients-track-wrap"
          style={{ overflow: "hidden", position: "relative" }}
        >
          {/* Left fade */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(90deg, #07152e, transparent)", zIndex: 2, pointerEvents: "none" }} />
          {/* Right fade */}
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(-90deg, #07152e, transparent)", zIndex: 2, pointerEvents: "none" }} />

          <div
            className="animate-slide-clients"
            style={{ display: "flex", gap: "28px", width: "max-content", padding: "10px 0" }}
          >
            {row1.map((client, index) => (
              <div
                key={index}
                className="client-card"
                style={{
                  flexShrink: 0,
                  width: client.large ? "320px" : "240px",
                  height: "220px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "28px 20px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: client.large ? "200px" : "110px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={client.image}
                    alt={client.name}
                    width={client.large ? 400 : 200}
                    height={client.large ? 200 : 100}
                    style={{
                      objectFit: "contain",
                      maxHeight: client.large ? "200px" : "100px",
                      width: "auto",
                      transition: "filter 0.3s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
