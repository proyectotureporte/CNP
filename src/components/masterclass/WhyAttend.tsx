"use client";

import { useReveal } from "@/hooks/useReveal";
import SectionHead from "./SectionHead";

const montserrat = "var(--font-montserrat), Montserrat, sans-serif";

const features = [
  {
    title: "Rigor probatorio",
    text: "Metodologías y estándares que fortalecen la calidad y credibilidad de la prueba.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5l8-3z" /><path d="M9 12l2 2 4-4" /></svg>
    ),
  },
  {
    title: "Análisis experto",
    text: "Perspectivas interdisciplinarias de profesionales con amplia experiencia.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="6" r="3" /><path d="M4 20v-1a5 5 0 0 1 5-5" /><path d="M14 20v-4M17.5 20v-7M21 20v-10" /></svg>
    ),
  },
  {
    title: "Aplicación práctica",
    text: "Herramientas y casos reales para aplicar de inmediato en sus procesos.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></svg>
    ),
  },
  {
    title: "Actualización jurídica",
    text: "Contenidos alineados con la normativa vigente y las tendencias jurisprudenciales.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.5C10.5 5 8 4.5 4 4.5V19c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2V4.5c-4 0-6.5.5-8 2z" /><path d="M12 6.5V21" /></svg>
    ),
  },
];

export default function WhyAttend() {
  const ref = useReveal();

  return (
    <section style={{ padding: "64px 0", backgroundColor: "#ffffff" }}>
      <div ref={ref} style={{ width: "100%", maxWidth: "1120px", margin: "0 auto", padding: "0 24px" }}>
        <SectionHead title="¿POR QUÉ ASISTIR?" />
        <div className="reveal-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="mc-card"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e9ecf2",
                borderRadius: "12px",
                padding: "24px 22px",
              }}
            >
              <div className="mc-feature-icon" style={{ color: "#2b57bc", marginBottom: "16px" }}>
                {feature.icon}
              </div>
              <h3 style={{ fontFamily: montserrat, fontSize: "16px", fontWeight: 700, color: "#1a2540", margin: "0 0 8px" }}>
                {feature.title}
              </h3>
              <p style={{ fontFamily: montserrat, fontSize: "13.5px", color: "#697089", margin: 0 }}>
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
