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

// Triple for seamless loop
const row1 = [...clients, ...clients, ...clients];
const row2 = [...clients].reverse();
const row2x = [...row2, ...row2, ...row2];

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

        {/* Row 1 — left to right */}
        <div
          className="clients-track-wrap"
          style={{ overflow: "hidden", position: "relative", marginBottom: "24px" }}
        >
          {/* Left fade */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(90deg, #07152e, transparent)", zIndex: 2, pointerEvents: "none" }} />
          {/* Right fade */}
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(-90deg, #07152e, transparent)", zIndex: 2, pointerEvents: "none" }} />

          <div
            className="animate-slide-clients"
            style={{ display: "flex", gap: "20px", width: "max-content", padding: "10px 0" }}
          >
            {row1.map((client, index) => (
              <div
                key={index}
                className="client-card"
                style={{
                  flexShrink: 0,
                  width: "190px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  padding: "20px 16px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={client.image}
                    alt={client.name}
                    width={150}
                    height={72}
                    style={{
                      objectFit: "contain",
                      maxHeight: "72px",
                      width: "auto",
                      transition: "filter 0.3s ease",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.6)",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  {client.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — right to left */}
        <div
          className="clients-track-wrap"
          style={{ overflow: "hidden", position: "relative" }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(90deg, #0d1f4e, transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(-90deg, #0d1f4e, transparent)", zIndex: 2, pointerEvents: "none" }} />

          <div
            className="animate-slide-clients-reverse"
            style={{ display: "flex", gap: "20px", width: "max-content", padding: "10px 0" }}
          >
            {row2x.map((client, index) => (
              <div
                key={index}
                className="client-card"
                style={{
                  flexShrink: 0,
                  width: "190px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "20px 16px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={client.image}
                    alt={client.name}
                    width={150}
                    height={72}
                    style={{
                      objectFit: "contain",
                      maxHeight: "72px",
                      width: "auto",
                      transition: "filter 0.3s ease",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
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
