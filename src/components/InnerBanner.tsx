"use client";

interface Props {
  title: string;
  text: string;
}

export default function InnerBanner({ title, text }: Props) {
  return (
    <section
      style={{
        background: "linear-gradient(120deg, #0a2a6e 0%, #0f3b85 100%)",
        padding: "0 30px",
        minHeight: "200px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "760px", textAlign: "center", padding: "48px 0" }}>
        <h2
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: "16px",
            lineHeight: 1.25,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.8,
          }}
        >
          {text}
        </p>
      </div>
    </section>
  );
}
