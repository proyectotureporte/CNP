"use client";

const pretensionOptions = [
  "10M - 50M",
  "50M - 100M",
  "100M - 500M",
  "500M - 1.000M",
  "1.000M+",
];

export default function QuoteForm() {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    color: "#333",
    backgroundColor: "#ffffff",
    border: "2px solid #d0d8e4",
    borderRadius: "12px",
    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
    fontSize: "14px",
    padding: "14px 18px",
    outline: "none",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
    fontSize: "13px",
    fontWeight: 700,
    color: "#1b5697",
    marginBottom: "6px",
    display: "block",
    letterSpacing: "0.3px",
  };

  return (
    <section id="cotizador" style={{ backgroundColor: "#f0f4f8", padding: "80px 0" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 30px" }}>
        {/* Card container */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            padding: "50px 44px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
            border: "1px solid #e8edf2",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "34px",
                fontWeight: 800,
                color: "#1b5697",
                marginBottom: "12px",
              }}
            >
              Cotice su Dictamen Pericial
            </h2>
            <div
              style={{
                width: "60px",
                height: "4px",
                backgroundColor: "#008fde",
                borderRadius: "2px",
                margin: "0 auto 16px",
              }}
            />
            <p
              style={{
                fontSize: "14px",
                color: "#6b7c93",
                lineHeight: 1.7,
                maxWidth: "560px",
                margin: "0 auto",
              }}
            >
              Complete los campos y un asesor se comunicar&aacute; a la brevedad.
              Su informaci&oacute;n se mantendr&aacute; en absoluta reserva.
            </p>
          </div>

          <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "20px" }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  placeholder="Ingrese su nombre"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#1b5697"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,86,151,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e4"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Correo Electr&oacute;nico *</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#1b5697"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,86,151,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e4"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "20px" }}>
              <div>
                <label style={labelStyle}>Tel&eacute;fono</label>
                <input
                  type="tel"
                  placeholder="+57 300 000 0000"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#1b5697"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,86,151,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e4"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej: Bogot&aacute;"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#1b5697"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,86,151,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e4"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Area del derecho */}
            <div>
              <label style={labelStyle}>&Aacute;rea del derecho</label>
              <textarea
                placeholder="Describa el &aacute;rea del derecho"
                rows={2}
                style={{ ...inputStyle, borderRadius: "12px", resize: "none" as const }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1b5697"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,86,151,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Pretensiones */}
            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e8edf2",
              }}
            >
              <p style={{ ...labelStyle, marginBottom: "12px" }}>Pretensiones</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {pretensionOptions.map((option, index) => (
                  <label
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d0d8e4",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#444",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input type="radio" name="pretensiones" value={option} style={{ accentColor: "#1b5697" }} />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Demanda */}
            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e8edf2",
              }}
            >
              <p style={{ ...labelStyle, marginBottom: "12px" }}>¿La demanda ya est&aacute; interpuesta?</p>
              <div style={{ display: "flex", gap: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #d0d8e4",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#444",
                    cursor: "pointer",
                  }}
                >
                  <input type="radio" name="demanda" value="si" style={{ accentColor: "#1b5697" }} /> S&iacute;
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #d0d8e4",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#444",
                    cursor: "pointer",
                  }}
                >
                  <input type="radio" name="demanda" value="no" style={{ accentColor: "#1b5697" }} /> No
                </label>
              </div>
            </div>

            {/* Resumen */}
            <div>
              <label style={labelStyle}>Breve resumen del caso</label>
              <textarea
                placeholder="Describa brevemente su caso"
                rows={4}
                style={{ ...inputStyle, borderRadius: "12px", resize: "none" as const }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1b5697"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,86,151,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Instancia */}
            <div>
              <label style={labelStyle}>Instancia</label>
              <input
                type="text"
                placeholder="Ingrese la instancia"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1b5697"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,86,151,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={{
                width: "100%",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                color: "#ffffff",
                background: "linear-gradient(135deg, #1b5697 0%, #008fde 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "18px 32px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                marginTop: "8px",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 20px rgba(27, 86, 151, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(27, 86, 151, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(27, 86, 151, 0.3)";
              }}
            >
              Enviar Solicitud
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
