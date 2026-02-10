import Image from "next/image";

const services = [
  {
    image: "/images/dictamen-pericial.jpg",
    title: "Elaboraci\u00f3n de Dictámenes Periciales",
    description:
      "Brindamos asesor\u00eda en la elaboraci\u00f3n, revisi\u00f3n, controversia y sustentaci\u00f3n de este tipo de pruebas ante despachos judiciales.",
  },
  {
    image: "/images/lawyers-office.jpg",
    title: "C\u00e1lculos de Perjuicios",
    description:
      "Calculamos el valor de sus pretensiones, eliminando el riesgo a incurrir en sanciones pecuniarias.",
  },
  {
    image: "/images/liquidaciones.jpg",
    title: "Realizaci\u00f3n de Liquidaciones",
    description:
      "Elaboramos liquidaciones t\u00e9cnicas con sustento contable para fortalecer su demanda.",
  },
];

export default function Services() {
  return (
    <section id="servicios" style={{ position: "relative", padding: "80px 0" }}>
      <Image src="/images/lawyers-office.jpg" alt="Background" fill style={{ objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 16, 40, 0.9)" }} />

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
          Servicios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "24px" }}>
          {services.map((service, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "16px",
                height: "420px",
              }}
            >
              <Image src={service.image} alt={service.title} fill style={{ objectFit: "cover" }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(3, 43, 87, 0.3) 0%, rgba(3, 43, 87, 0.85) 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  padding: "30px 24px",
                  textAlign: "center",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: "12px",
                    lineHeight: 1.3,
                  }}
                >
                  {service.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: 1.6,
                    marginBottom: "20px",
                    maxWidth: "90%",
                  }}
                >
                  {service.description}
                </p>
                <a
                  href="#cotizador"
                  style={{
                    display: "inline-block",
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#ffffff",
                    background: "linear-gradient(135deg, #1b5697 0%, #008fde 100%)",
                    borderRadius: "55px",
                    padding: "11px 28px",
                    textDecoration: "none",
                    letterSpacing: "0.5px",
                    transition: "transform 0.2s ease",
                  }}
                >
                  VER M&Aacute;S
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
