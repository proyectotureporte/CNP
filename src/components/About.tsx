"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

export default function About() {
  const ref = useReveal();

  return (
    <section id="quienes" style={{ backgroundColor: "#dce8f5", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1500px", margin: "0 auto", padding: "0 60px" }}>
        <div className="flex flex-col lg:flex-row" style={{ gap: "50px", alignItems: "center" }}>
          {/* Text column */}
          <div className="w-full lg:w-[65%] reveal-left">
            <h2
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "clamp(28px, 4vw, 36px)",
                fontWeight: 800,
                color: "#0a2a6e",
                marginBottom: "24px",
              }}
            >
              ¿Quiénes somos?
            </h2>
            <p
              style={{
                fontSize: "23px",
                color: "#333",
                lineHeight: 1.2,
                marginBottom: "32px",
                textAlign: "justify",
              }}
            >
              Centro Nacional de Pruebas – CNP es una firma especializada en dictámenes periciales financieros y valoración técnica de pruebas, que apoya a abogados, jueces, magistrados y empresas en la comprensión de asuntos económicos complejos dentro de procesos judiciales.
              <br /><br />
              Con más de 10 años de experiencia, brindamos análisis independientes y técnicamente rigurosos en materias contables, financieras, tributarias y económicas, aportando claridad técnica a controversias judiciales y empresariales.
              <br /><br />
              Nuestro equipo de expertos convierte información financiera compleja en dictámenes claros y comprensibles, facilitando la valoración de la prueba y fortaleciendo la toma de decisiones dentro del litigio.
              <br /><br />
              En CNP contribuimos a que las decisiones jurídicas se fundamenten en análisis técnico sólido, evidencia confiable y rigor profesional.
            </p>
          </div>

          {/* Image column */}
          <div className="w-full lg:w-[32%] reveal-right" style={{ textAlign: "center" }}>
            <div
              style={{
                backgroundColor: "#c0d4ec",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
                position: "relative",
                height: "468px",
              }}
            >
              <Image
                src="/images/quiene.jpg"
                alt="¿Quiénes somos?"
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
