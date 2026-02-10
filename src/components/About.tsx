import Image from "next/image";

export default function About() {
  return (
    <section id="sobre-nosotros" style={{ backgroundColor: "#fdfdfd", padding: "80px 0" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 30px" }}>
        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "36px",
            fontWeight: 800,
            color: "#1b5697",
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          Sobre Nosotros
        </h2>

        <div className="flex flex-col lg:flex-row" style={{ gap: "50px", alignItems: "flex-start" }}>
          {/* Text column */}
          <div className="w-full lg:w-[55%]">
            <p
              style={{
                fontSize: "16px",
                color: "#444",
                lineHeight: 1.85,
                marginBottom: "20px",
              }}
            >
              CNP es una entidad de car&aacute;cter privado con m&aacute;s de 10 a&ntilde;os de
              experiencia en la elaboraci&oacute;n de dict&aacute;menes y pruebas financieras,
              as&iacute; como en la asesor&iacute;a t&eacute;cnica a abogados, jueces, magistrados y
              empresas del sector real en temas probatorios de car&aacute;cter contable,
              tributario y econ&oacute;mico.
            </p>
            <p
              style={{
                fontSize: "16px",
                color: "#444",
                lineHeight: 1.85,
                marginBottom: "32px",
              }}
            >
              Contamos con un equipo altamente calificado en auditor&iacute;a, an&aacute;lisis
              financiero y valoraci&oacute;n de pruebas, que apoya la toma de decisiones
              en controversias judiciales con sustento t&eacute;cnico y precisi&oacute;n
              profesional.
            </p>
            <a
              href="https://api.whatsapp.com/send/?phone=573164071992"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                color: "#ffffff",
                background: "linear-gradient(135deg, #1b5697 0%, #008fde 100%)",
                borderRadius: "55px",
                padding: "14px 32px",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(27, 86, 151, 0.3)",
                transition: "transform 0.2s ease",
              }}
            >
              Cont&aacute;ctanos
            </a>
          </div>

          {/* Image column */}
          <div className="w-full lg:w-[42%]">
            <Image
              src="/images/about-team.jpg"
              alt="Equipo CNP"
              width={550}
              height={380}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "12px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
