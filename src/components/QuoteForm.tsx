"use client";

import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";

interface Props {
  origen?: "landing" | "abogados" | "empresas" | "jueces";
}

export default function QuoteForm({ origen = "landing" }: Props) {
  const ref = useReveal();
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
            Formulario cotizaci&oacute;n
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
                  marginTop: "8px",
                  letterSpacing: "0.3px",
                }}
              >
                {status === "loading" ? "Enviando..." : "Enviar"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
