"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const clients = [
  { src: "/images/corficolombiana.jpg", alt: "Corficolombiana" },
  { src: "/images/banco-popular.png", alt: "Banco Popular" },
  { src: "/images/bancolombia.png", alt: "Bancolombia" },
  { src: "/images/davivienda.png", alt: "Davivienda" },
  { src: "/images/cliente1.png", alt: "Cliente 1" },
  { src: "/images/cliente2.png", alt: "Cliente 2" },
  { src: "/images/cliente3.png", alt: "Cliente 3" },
  { src: "/images/captura-logo.png", alt: "Cliente 4" },
];

export default function Clients() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % clients.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const getVisible = (count: number) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(clients[(current + i) % clients.length]);
    }
    return arr;
  };

  return (
    <section id="clientes" style={{ backgroundColor: "#ffffff", padding: "80px 0" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 30px" }}>
        <h2
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "40px",
            fontWeight: 800,
            color: "#1b5697",
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          Nuestros Clientes
        </h2>

        {/* Desktop carousel: 3 logos - triple size */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: "60px",
          }}
        >
          {getVisible(3).map((client, index) => (
            <div
              key={`${current}-${index}`}
              style={{
                width: "300px",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.5s ease",
              }}
            >
              <Image
                src={client.src}
                alt={client.alt}
                width={300}
                height={200}
                style={{ objectFit: "contain", maxHeight: "180px", width: "auto", maxWidth: "280px" }}
              />
            </div>
          ))}
        </div>

        {/* Mobile: 1 logo - big */}
        <div
          className="md:hidden"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "280px",
              height: "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src={clients[current].src}
              alt={clients[current].alt}
              width={280}
              height={180}
              style={{ objectFit: "contain", maxHeight: "160px", width: "auto" }}
            />
          </div>
        </div>

        {/* Navigation dots */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "36px", gap: "8px" }}>
          {clients.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              style={{
                width: current === index ? "28px" : "10px",
                height: "10px",
                borderRadius: "5px",
                backgroundColor: current === index ? "#1b5697" : "#d0d8e4",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              aria-label={`Cliente ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
