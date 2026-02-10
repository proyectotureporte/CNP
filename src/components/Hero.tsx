import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="inicio"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Image src="/images/hero-bg.jpg" alt="Background" fill style={{ objectFit: "cover", objectPosition: "center top" }} priority />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 43, 137, 0.5)" }} />

      {/* Content aligned to the RIGHT */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 30px",
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ maxWidth: "540px" }}>
          <p
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "17px",
              fontStyle: "italic",
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: "14px",
            }}
          >
            El respaldo que su proceso necesita
          </p>
          <h1
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "44px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              marginBottom: "24px",
            }}
          >
            Centro Nacional de Pruebas
          </h1>
          <p
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontSize: "18.4px",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.92)",
              lineHeight: 1.8,
              marginBottom: "36px",
              textAlign: "justify" as const,
            }}
          >
            En CNP nos especializamos en la elaboraci&oacute;n de dict&aacute;menes financieros y
            pruebas t&eacute;cnicas que respaldan procesos judiciales complejos.
            Acompa&ntilde;amos a jueces, abogados y empresas del sector real con an&aacute;lisis
            contable, tributario y econ&oacute;mico, aportando claridad, sustento t&eacute;cnico
            y confiabilidad en la valoraci&oacute;n de la prueba financiera.
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
              backgroundColor: "#ffffff",
              color: "#1b5697",
              borderRadius: "60px",
              padding: "14px 36px",
              textDecoration: "none",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              transition: "transform 0.2s ease",
            }}
          >
            CONT&Aacute;CTANOS
          </a>
        </div>
      </div>
    </section>
  );
}
