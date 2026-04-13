"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

interface Card {
  title: string;
  image: string;
  text: string;
}

interface Props {
  sectionTitle: string;
  sectionText: string;
  cards: Card[];
}

export default function InnerContent({ sectionTitle, sectionText, cards }: Props) {
  const ref = useReveal();

  return (
    <section style={{ backgroundColor: "#ffffff", padding: "90px 0" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 30px" }}>
        {/* Title + paragraph */}
        <div className="reveal" style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 64px" }}>
          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 800,
              color: "#0a2a6e",
              marginBottom: "20px",
            }}
          >
            {sectionTitle}
          </h2>
          <div
            style={{
              width: "60px",
              height: "4px",
              background: "linear-gradient(90deg, #ea580c, #fbbf24)",
              borderRadius: "2px",
              margin: "0 auto 24px",
            }}
          />
          <p
            style={{
              fontSize: "16px",
              color: "#475569",
              lineHeight: 1.85,
            }}
          >
            {sectionText}
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 reveal-stagger" style={{ gap: "28px" }}>
          {cards.map((card, index) => (
            <div
              key={index}
              style={{
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 24px rgba(10,42,110,0.08)",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-8px) scale(1.02)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 56px rgba(10,42,110,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(10,42,110,0.08)";
              }}
            >
              {/* Title bar */}
              <div
                style={{
                  background: "linear-gradient(135deg, #0a2a6e, #0f3b85)",
                  padding: "20px 22px",
                }}
              >
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    lineHeight: 1.3,
                  }}
                >
                  {card.title}
                </h3>
              </div>

              {/* Image */}
              <div style={{ position: "relative", height: "200px" }}>
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>

              {/* Text */}
              <div style={{ padding: "24px 22px", flex: 1, backgroundColor: "#ffffff" }}>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#475569",
                    lineHeight: 1.8,
                    textAlign: "justify",
                  }}
                >
                  {card.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
