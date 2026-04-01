"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

export default function About() {
  const ref = useReveal();

  return (
    <section id="quienes" style={{ backgroundColor: "#dce8f5", padding: "80px 0" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 30px" }}>
        <div className="flex flex-col lg:flex-row" style={{ gap: "50px", alignItems: "center" }}>
          {/* Text column */}
          <div className="w-full lg:w-[55%] reveal-left">
            <h2
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "clamp(28px, 4vw, 36px)",
                fontWeight: 800,
                color: "#0a2a6e",
                marginBottom: "24px",
              }}
            >
              &iquest;Qui&eacute;nes somos?
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#333",
                lineHeight: 1.85,
                marginBottom: "32px",
              }}
            >
              CNP es una entidad de car&aacute;cter privado con m&aacute;s de 10
              a&ntilde;os de experiencia en la elaboraci&oacute;n de
              dict&aacute;menes, as&iacute; como en la asesor&iacute;a
              t&eacute;cnica a abogados, jueces, magistrados y empresas del
              sector real en temas probatorios de car&aacute;cter contable,
              tributario y econ&oacute;mico. Contamos con un equipo altamente
              calificado en auditor&iacute;a, an&aacute;lisis financiero y
              valoraci&oacute;n de pruebas, que apoya la toma de decisiones en
              controversias judiciales con sustento t&eacute;cnico y
              precisi&oacute;n profesional.
            </p>
            <a
              href="#equipo"
              className="btn-pulse"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "15px",
                fontWeight: 800,
                backgroundColor: "#ea580c",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "14px 32px",
                textDecoration: "none",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Conozca el equipo
            </a>
          </div>

          {/* Image column */}
          <div className="w-full lg:w-[42%] reveal-right" style={{ textAlign: "center" }}>
            <div
              style={{
                backgroundColor: "#c0d4ec",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              <Image
                src="/images/quiene.png"
                alt="¿Quiénes somos?"
                width={500}
                height={400}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
