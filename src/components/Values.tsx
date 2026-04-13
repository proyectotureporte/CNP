"use client";

import { useReveal } from "@/hooks/useReveal";

const values = [
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0a2a6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    iconBack: (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#7eb8f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    label: "Precisión",
    backLabel: "Rigor técnico",
    text: "Dictámenes elaborados con metodologías profesionales y sustento técnico verificable.",
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0a2a6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    iconBack: (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#7eb8f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Puntualidad",
    backLabel: "Independencia y objetividad",
    text: "Análisis imparciales que fortalecen la credibilidad de la prueba.",
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0a2a6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <path d="M8 11h6" />
        <path d="M11 8v6" />
      </svg>
    ),
    iconBack: (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#7eb8f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <path d="M8 11h6" />
        <path d="M11 8v6" />
      </svg>
    ),
    label: "Análisis",
    backLabel: "Claridad probatoria",
    text: "Transformamos información financiera compleja en análisis comprensibles para el proceso judicial.",
  },
];

export default function Values() {
  const ref = useReveal();

  return (
    <section style={{ backgroundColor: "#dce8f5", padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 30px" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "64px" }}>
          <p
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#ea580c",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Lo que nos define
          </p>
          <h2
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 800,
              color: "#0a2a6e",
            }}
          >
            Nuestros valores
          </h2>
          <div
            style={{
              width: "60px",
              height: "4px",
              background: "linear-gradient(90deg, #0a2a6e, #1a5fb4)",
              borderRadius: "2px",
              margin: "20px auto 0",
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 reveal-stagger" style={{ gap: "28px" }}>
          {values.map((value, index) => (
            <div key={index} className="value-card">
              <div className="value-card-inner">
                {/* Front */}
                <div className="value-card-front">
                  <div
                    style={{
                      width: "88px",
                      height: "88px",
                      borderRadius: "50%",
                      backgroundColor: "#e8f0fb",
                      border: "2px solid #c0d4ec",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {value.icon}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#0a2a6e",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {value.label}
                  </p>
                  <p style={{ fontSize: "12px", color: "#0a2a6e", letterSpacing: "1px", textTransform: "uppercase" }}>
                    Pase el cursor →
                  </p>
                </div>

                {/* Back */}
                <div className="value-card-back">
                  {value.iconBack}
                  <p
                    style={{
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontSize: "17px",
                      fontWeight: 800,
                      color: "#fbbf24",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {value.backLabel}
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      color: "rgba(255,255,255,0.92)",
                      lineHeight: 1.8,
                      textAlign: "center",
                    }}
                  >
                    {value.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
