import Image from "next/image";

export default function MiniGuarantee() {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderTop: "4.5px solid #c9a84c",
        borderBottom: "4.5px solid #c9a84c",
        margin: "0 60px 60px",
        padding: "4px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "32px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: "clamp(29px, 2.4vw, 39px)",
            fontWeight: 700,
            color: "#0d1f4e",
            marginBottom: "10px",
          }}
        >
          Nuestra Garantía: 100% Hechos
        </h3>
        <p
          style={{
            fontSize: "clamp(22px, 1.7vw, 26px)",
            color: "#4a5568",
            lineHeight: 1,
          }}
        >
          Garantizamos total independencia y objetividad. Nuestros expertos se enfocan
          exclusivamente en los hallazgos<br />técnicos para guiar la decisión judicial sin ambigüedades.
        </p>
      </div>

      <Image
        src="/images/MINI.svg"
        alt="Garantía"
        width={144}
        height={144}
        style={{ flexShrink: 0 }}
      />
    </div>
  );
}
