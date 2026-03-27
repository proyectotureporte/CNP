"use client";

import Image from "next/image";

interface Props {
  title: string;
  subtitle: string;
  bgImage: string;
}

export default function InnerHero({ title, subtitle, bgImage }: Props) {
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
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
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
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
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
              fontFamily: "'Open Sans', sans-serif",
              fontSize: "17px",
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.8,
              maxWidth: "560px",
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
