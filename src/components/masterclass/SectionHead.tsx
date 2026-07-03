"use client";

interface Props {
  title: string;
}

export default function SectionHead({ title }: Props) {
  return (
    <div className="reveal" style={{ textAlign: "center", marginBottom: "34px" }}>
      <h2
        style={{
          fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
          fontSize: "22px",
          fontWeight: 700,
          color: "#1a2540",
          letterSpacing: "0.02em",
          display: "inline-block",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: "44px",
          height: "3px",
          borderRadius: "3px",
          backgroundColor: "#2b57bc",
          margin: "8px auto 0",
        }}
      />
    </div>
  );
}
