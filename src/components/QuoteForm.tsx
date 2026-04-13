"use client";

import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";

interface Props {
  origen?: "landing" | "abogados" | "empresas" | "jueces";
}

const config: Record<string, { titulo: string; boton1: string }> = {
  landing:   { titulo: "Solicitar estudio de mi caso",                                    boton1: "Solicitar evaluación" },
  abogados:  { titulo: "Completa el formulario y evaluaremos tu caso.",                    boton1: "Evaluar mi caso jurídico" },
  empresas:  { titulo: "Completa el formulario para recibir tu análisis empresarial.",     boton1: "Evaluar mi empresa" },
  jueces:    { titulo: "Cuéntanos tu caso para realizar una evaluación objetiva",          boton1: "Solicitar evaluación imparcial" },
};

export default function QuoteForm({ origen = "landing" }: Props) {
  const ref = useReveal();
  const { titulo, boton1 } = config[origen] ?? config.landing;
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/web-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, mensaje, origen }),
      });
      if (res.ok) {
        setStatus("ok");
        setNombre("");
        setEmail("");
        setMensaje("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    color: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
    fontSize: "15px",
    padding: "16px 20px",
    outline: "none",
    transition: "border-color 0.3s ease",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: "8px",
    display: "block",
  };

  return (
    <section id="contacto" style={{ backgroundColor: "#0d1f4e", padding: "100px 0" }}>
      <div ref={ref} style={{ maxWidth: "720px", margin: "0 auto", padding: "0 30px" }}>
        <div
          className="reveal-scale"
          style={{
            backgroundColor: "#2a4a8a",
            borderRadius: "16px",
            padding: "60px 48px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            {titulo}
          </h2>

          {status === "ok" ? (
            <p
              style={{
                textAlign: "center",
                color: "#86efac",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              ¡Mensaje enviado! Nos pondremos en contacto pronto.
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "24px" }}>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input
                    type="text"
                    placeholder="Ingrese su nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Correo electr&oacute;nico *</label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Mensaje</label>
                <textarea
                  placeholder="Describa brevemente su consulta"
                  rows={5}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  style={{ ...inputStyle, resize: "none" as const }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                />
              </div>

              {status === "error" && (
                <p style={{ color: "#fca5a5", fontSize: "14px", textAlign: "center" }}>
                  Error al enviar. Intente nuevamente.
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#ffffff",
                    backgroundColor: status === "loading" ? "#0a2a6e99" : "#0a2a6e",
                    border: "none",
                    borderRadius: "8px",
                    padding: "18px 32px",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    letterSpacing: "0.3px",
                  }}
                >
                  {status === "loading" ? "Enviando..." : boton1}
                </button>

                <a
                  href="https://wa.me/573164071992?text=quiero%20hablar%20con%20un%20agente%20de%20CNP"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#ffffff",
                    backgroundColor: "#25d366",
                    borderRadius: "8px",
                    padding: "18px 32px",
                    textDecoration: "none",
                    letterSpacing: "0.3px",
                    transition: "background-color 0.2s ease",
                    boxSizing: "border-box",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                  Hablar con un agente
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
