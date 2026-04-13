"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const tarjetas = [
  {
    icon: "/images/36.svg",
    titulo: "Para abogados litigantes",
    descripcion: "Fortalecemos la teoría del caso a través de análisis técnicos que sustentan la reclamación financiera.",
  },
  {
    icon: "/images/37.svg",
    titulo: "Para Firmas de Abogados",
    descripcion: "Proveedor confiable de soporte experto especializado para casos complejos, ofreciendo soluciones integrales en múltiples situaciones.",
  },
  {
    icon: "/images/38.svg",
    titulo: "Para Empresas",
    descripcion: "Análisis técnico para disputas contractuales, reclamaciones financieras y litigios corporativos, protegiendo los activos de la empresa.",
  },
  {
    icon: "/images/39.svg",
    titulo: "Para Jueces",
    descripcion: "Brindamos dictámenes periciales y peritajes en el esclarecimiento de puntos técnicos y científicos, para establecer la verdad procesal y la correcta valoración de la prueba.",
  },
  {
    icon: "/images/40.svg",
    titulo: "Para Particulares",
    descripcion: "Soporte experto para demostrar y cuantificar pérdidas financieras.",
  },
];

export default function SolucionesClientes() {
  const ref = useReveal();

  return (
    <section style={{ backgroundColor: "#f8fafd", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1500px", margin: "0 auto", padding: "0 30px" }}>

        {/* Título */}
        <div className="reveal" style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "clamp(22px, 2.8vw, 38px)",
              fontWeight: 800,
              color: "#0d1f4e",
              lineHeight: 1.2,
            }}
          >
            Soluciones diseñadas para diferentes tipos de clientes
          </h2>
        </div>

        {/* Tarjetas */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 reveal-stagger"
          style={{ gap: "20px", marginBottom: "44px" }}
        >
          {tarjetas.map((t, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#0d1f4e",
                borderRadius: "14px",
                padding: "36px 22px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "18px",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              className="soluciones-card"
            >
              <Image src={t.icon} alt={t.titulo} width={108} height={108} />
              <h3
                style={{
                  fontSize: "clamp(24px, 1.95vw, 29px)",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.3,
                }}
              >
                {t.titulo}
              </h3>
              <p
                style={{
                  fontSize: "clamp(20px, 1.5vw, 23px)",
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.6,
                }}
              >
                {t.descripcion}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <a
            href="#audiencia"
            style={{
              display: "inline-block",
              backgroundColor: "#c9a84c",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "clamp(23px, 1.8vw, 27px)",
              letterSpacing: "0.5px",
              padding: "15px 48px",
              borderRadius: "8px",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Explorar soluciones
          </a>
        </div>

      </div>
    </section>
  );
}
