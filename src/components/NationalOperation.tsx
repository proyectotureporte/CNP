"use client";

import { useReveal } from "@/hooks/useReveal";

export default function NationalOperation() {
  const ref = useReveal();

  return (
    <section style={{ backgroundColor: "#0d1f4e", padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 30px" }}>
        <h2
          className="reveal"
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          Operaci&oacute;n nacional
        </h2>

        <div className="reveal-scale" style={{ marginBottom: "36px", borderRadius: "12px", overflow: "hidden" }}>
          <iframe
            src="https://maps.google.com/maps?q=Carrera+101+17-53,+Cali,+Colombia&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="400"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicaci&oacute;n CNP - Carrera 101 17-53, Cali"
          />
        </div>

        <p
          className="reveal"
          style={{
            fontSize: "17px",
            color: "rgba(255, 255, 255, 0.9)",
            lineHeight: 1.8,
            textAlign: "center",
            maxWidth: "640px",
            margin: "0 auto",
          }}
        >
          En CNP trabajamos en todo el territorio Colombiano, ofreciendo un
          servicio de calidad sin restricci&oacute;n por la ubicaci&oacute;n de
          nuestros clientes.
        </p>
      </div>
    </section>
  );
}
