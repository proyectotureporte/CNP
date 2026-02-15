import Image from "next/image";

const benefits = [
  "Precisión en pretensiones y liquidaciones, clave para fortalecer su caso.",
  "Preparación de interrogatorios con sustento técnico.",
  "Análisis técnico de dictámenes aplicados a procesos judiciales.",
  "Definición de estrategias probatorias que generen ventajas competitivas.",
  "Valoración del juramento estimatorio con enfoque financiero y probatorio.",
  "Estructuración de argumentos técnicos que contribuyan a persuadir con claridad.",
  "Capacitación especializada en temas financieros y contables para abogados y equipos jurídicos.",
];

export default function Benefits() {
  return (
    <section id="beneficios" style={{ position: "relative", padding: "80px 0" }}>
      <Image src="/images/office-meeting.jpg" alt="Background" fill style={{ objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 16, 40, 0.85)" }} />

      <div style={{ position: "relative", zIndex: 10, maxWidth: "1100px", margin: "0 auto", padding: "0 30px" }}>
        <h2
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "36px",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          Beneficios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: "28px 44px" }}>
          {benefits.map((benefit, index) => (
            <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  flexShrink: 0,
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "2px solid rgba(78, 179, 234, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "2px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4eb3ea" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.9)", lineHeight: 1.7 }}>
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
