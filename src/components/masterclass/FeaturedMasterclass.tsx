"use client";

import Image from "next/image";

const montserrat = "var(--font-montserrat), Montserrat, sans-serif";

const CalendarIcon = ({ size, stroke, strokeWidth }: { size: number; stroke: string; strokeWidth: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
);

const ClockIcon = ({ size, stroke, strokeWidth }: { size: number; stroke: string; strokeWidth: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);

const buildMetaItems = (fechaTexto: string, horaMeta: string, modalidad: string, cupoTexto: string) => [
  {
    label: "Fecha",
    value: fechaTexto,
    icon: <CalendarIcon size={20} stroke="currentColor" strokeWidth={1.8} />,
  },
  {
    label: "Hora",
    value: horaMeta,
    icon: <ClockIcon size={20} stroke="currentColor" strokeWidth={1.8} />,
  },
  {
    label: "Modalidad",
    value: modalidad,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
    ),
  },
  {
    label: "Cupo limitado",
    value: cupoTexto,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20v-1a5.5 5.5 0 0 1 11 0v1" /><circle cx="17" cy="9" r="2.6" /><path d="M15.5 14.6a4.5 4.5 0 0 1 6 4.4v1" /></svg>
    ),
  },
];

export interface FeaturedContenido {
  mes?: string; dia?: string; anio?: string;
  fechaTexto?: string; hora?: string; horaNota?: string; horaMeta?: string;
  modalidad?: string; cupoTexto?: string;
  titulo?: string; descripcion?: string;
  ponenteNombre?: string; ponenteCargo?: string; ponenteFoto?: string;
  botonTexto?: string;
}

export default function FeaturedMasterclass({ contenido }: { contenido?: FeaturedContenido }) {
  const c = {
    mes: contenido?.mes || "Julio",
    dia: contenido?.dia || "16",
    anio: contenido?.anio || "2026",
    fechaTexto: contenido?.fechaTexto || "16 de julio de 2026",
    hora: contenido?.hora || "10:00 a. m.",
    horaNota: contenido?.horaNota || "(Hora Colombia)",
    horaMeta: contenido?.horaMeta || "10:00 a. m. (hora Colombia)",
    modalidad: contenido?.modalidad || "Online en vivo",
    cupoTexto: contenido?.cupoTexto || "Reserva tu lugar",
    titulo: contenido?.titulo || "Lucro cesante y daño emergente: cómo se prueban y cómo se controvierten",
    descripcion: contenido?.descripcion || "Una sesión especializada que aborda, desde una perspectiva técnico-probatoria, las claves para acreditar y controvertir el lucro cesante y el daño emergente en el marco de la práctica judicial.",
    ponenteNombre: contenido?.ponenteNombre || "Dr. Freddy Armando Oliveros Carvajal",
    ponenteCargo: contenido?.ponenteCargo || "Director CNP",
    ponenteFoto: contenido?.ponenteFoto || "/images/masterclass/ponente-freddy-oliveros.webp",
    botonTexto: contenido?.botonTexto || "Reservar cupo",
  };
  const metaItems = buildMetaItems(c.fechaTexto, c.horaMeta, c.modalidad, c.cupoTexto);
  return (
    <section style={{ backgroundColor: "#ffffff" }}>
      <div style={{ width: "100%", maxWidth: "1120px", margin: "0 auto", padding: "0 24px" }}>
        <article
          className="mc-fade-up grid gap-[26px] md:grid-cols-2 lg:[grid-template-columns:0.9fr_1.35fr_1fr] -mt-10 md:-mt-14"
          style={{
            position: "relative",
            zIndex: 5,
            backgroundColor: "#ffffff",
            border: "1px solid #e9ecf2",
            borderRadius: "18px",
            boxShadow: "0 18px 44px -20px rgba(13, 36, 79, 0.28)",
            padding: "26px",
            animationDelay: "0.15s",
          }}
        >
          {/* Columna 1 · fecha */}
          <div
            className="flex flex-col gap-4 text-center md:col-span-2 md:flex-row md:items-center md:justify-between md:text-left lg:col-span-1 lg:flex-col lg:items-stretch lg:gap-5"
            style={{
              background: "linear-gradient(160deg, #0d244f, #0a1c40)",
              color: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  flex: "0 0 auto",
                  borderRadius: "50%",
                  backgroundColor: "#2b57bc",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CalendarIcon size={18} stroke="#ffffff" strokeWidth={2} />
              </span>
              <span style={{ fontFamily: montserrat, fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", color: "#dbe4f5" }}>
                PRÓXIMA MASTERCLASS
              </span>
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "9px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: montserrat, fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", color: "#9db4de", textTransform: "uppercase" }}>{c.mes}</div>
              <div style={{ fontFamily: montserrat, fontSize: "46px", fontWeight: 800, lineHeight: 1, margin: "4px 0 2px" }}>{c.dia}</div>
              <div style={{ fontFamily: montserrat, fontSize: "13px", color: "#9db4de" }}>{c.anio}</div>
            </div>

            <div className="flex items-center justify-center gap-2" style={{ fontFamily: montserrat, fontSize: "13px", color: "#d7e0f2" }}>
              <ClockIcon size={15} stroke="#9db4de" strokeWidth={2} />
              <span>
                {c.hora}
                <small style={{ display: "block", color: "#9db4de" }}>{c.horaNota}</small>
              </span>
            </div>
          </div>

          {/* Columna 2 · contenido */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                backgroundColor: "#e6edfa",
                color: "#2456b8",
                fontFamily: montserrat,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.07em",
                padding: "6px 12px",
                borderRadius: "20px",
                marginBottom: "14px",
                textTransform: "uppercase",
              }}
            >
              Masterclass destacada
            </span>
            <h2
              style={{
                fontFamily: montserrat,
                fontSize: "23px",
                fontWeight: 700,
                color: "#1a2540",
                lineHeight: 1.2,
                margin: "0 0 18px",
              }}
            >
              {c.titulo}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Image
                src={c.ponenteFoto}
                alt={c.ponenteNombre}
                width={38}
                height={38}
                style={{ borderRadius: "50%", objectFit: "cover", backgroundColor: "#d7deea", flex: "0 0 auto" }}
              />
              <div>
                <div style={{ fontFamily: montserrat, fontSize: "13px", fontWeight: 700, color: "#1a2540", lineHeight: 1.15 }}>
                  {c.ponenteNombre}
                </div>
                <div style={{ fontFamily: montserrat, fontSize: "12px", color: "#697089" }}>{c.ponenteCargo}</div>
              </div>
            </div>

            <p style={{ fontFamily: montserrat, fontSize: "14px", color: "#697089", margin: 0 }}>
              {c.descripcion}
            </p>
          </div>

          {/* Columna 3 · detalles + CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {metaItems.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "#8b93a6", marginTop: "2px", flex: "0 0 auto" }}>{item.icon}</span>
                <div>
                  <div style={{ fontFamily: montserrat, fontSize: "12px", color: "#8b93a6" }}>{item.label}</div>
                  <div style={{ fontFamily: montserrat, fontSize: "14px", fontWeight: 600, color: "#1a2540" }}>{item.value}</div>
                </div>
              </div>
            ))}

            <a
              href="#reservar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: "10px",
                fontFamily: montserrat,
                fontSize: "15px",
                fontWeight: 600,
                lineHeight: 1,
                padding: "14px 22px",
                borderRadius: "9px",
                backgroundColor: "#0d244f",
                color: "#ffffff",
                textDecoration: "none",
                marginTop: "2px",
                transition: "transform 0.15s ease, background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#132e5e";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0d244f";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {c.botonTexto}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
