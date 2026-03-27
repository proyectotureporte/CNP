"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const audiences = [
  {
    label: "Soy abogado",
    image: "/images/lawyers-office.jpg",
    href: "/abogados",
  },
  {
    label: "Soy empresa",
    image: "/images/office-meeting.jpg",
    href: "/empresas",
  },
  {
    label: "Soy juez",
    image: "/images/gavel.jpg",
    href: "/jueces",
  },
];

export default function AudienceCards() {
  const ref = useReveal();

  return (
    <section style={{ backgroundColor: "#07152e", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 30px" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 reveal-stagger" style={{ gap: "24px" }}>
          {audiences.map((a, index) => (
            <div
              key={index}
              style={{
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* 80% image */}
              <div className="audience-img-wrap" style={{ position: "relative", flex: "0 0 auto" }}>
                <div style={{ paddingTop: "120%" }} />
                <Image
                  src={a.image}
                  alt={a.label}
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
                <div className="audience-overlay">
                  <span
                    style={{
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.85)",
                      textAlign: "center",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Haga clic en Ver m&aacute;s para conocer nuestros servicios
                  </span>
                </div>
              </div>

              {/* 20% text + button */}
              <div
                style={{
                  backgroundColor: "#0f3b85",
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#ffffff",
                    textAlign: "center",
                    letterSpacing: "0.3px",
                  }}
                >
                  {a.label}
                </h3>
                <a
                  href={a.href}
                  className="btn-pulse"
                  style={{
                    display: "inline-block",
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "13px",
                    fontWeight: 800,
                    backgroundColor: "#ea580c",
                    color: "#ffffff",
                    borderRadius: "8px",
                    padding: "10px 28px",
                    textDecoration: "none",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Ver m&aacute;s
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
