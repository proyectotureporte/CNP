"use client";

import { useReveal } from "@/hooks/useReveal";

const values = [
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0a2a6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    text: "Precisi\u00F3n en pretensiones y liquidaciones, clave para fortalecer su caso.",
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0a2a6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    text: "Precisi\u00F3n en pretensiones y liquidaciones, clave para fortalecer su caso.",
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0a2a6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <path d="M8 11h6" />
        <path d="M11 8v6" />
      </svg>
    ),
    text: "Precisi\u00F3n en pretensiones y liquidaciones, clave para fortalecer su caso.",
  },
];

export default function Values() {
  const ref = useReveal();

  return (
    <section style={{ backgroundColor: "#dce8f5", padding: "100px 0" }}>
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
          Nuestros valores
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 reveal-stagger" style={{ gap: "50px" }}>
          {values.map((value, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "24px",
              }}
            >
              {value.icon}
              <p
                style={{
                  fontSize: "16px",
                  color: "#333",
                  lineHeight: 1.8,
                  maxWidth: "320px",
                }}
              >
                {value.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
