"use client";

import Image from "next/image";

interface Props {
  title: string;
  subtitle: string;
  bgImage: string;
  showButtons?: boolean;
  btn1Label?: string;
  btn2Label?: string;
}

export default function InnerHero({ title, subtitle, bgImage, showButtons = false, btn1Label = "Evaluar mi caso jurídico", btn2Label = "Hablar con un agente" }: Props) {
  return (
    <section
      style={{
        position: "relative",
        height: "480px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Image
        src={bgImage}
        alt={title}
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        priority
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(120deg, rgba(10,42,110,0.82) 0%, rgba(15,59,133,0.70) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 30px",
          width: "100%",
        }}
      >
        <div style={{ maxWidth: "680px" }}>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#fbbf24",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Centro Nacional de Pruebas
          </p>
          <h1
            style={{
              fontSize: "clamp(30px, 4.5vw, 52px)",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              marginBottom: "20px",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "26px",
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.2,
              maxWidth: "820px",
            }}
          >
            {subtitle}
          </p>

          {showButtons && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", marginTop: "32px" }}>
              <a
                href="#contacto"
                className="btn-pulse"
                style={{
                  display: "inline-block",
                  backgroundColor: "#ea580c",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "19px",
                  padding: "14px 36px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  letterSpacing: "0.4px",
                }}
              >
                {btn1Label}
              </a>
              <a
                href="https://wa.me/573164071992?text=quiero%20hablar%20con%20un%20agente%20de%20CNP"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pulse"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#ea580c",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "19px",
                  padding: "14px 36px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  letterSpacing: "0.4px",
                }}
              >
                {btn2Label}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
