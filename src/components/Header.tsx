"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const navItems = [
  { label: "INICIO", href: "#inicio" },
  { label: "SOBRE NOSOTROS", href: "#sobre-nosotros" },
  { label: "SERVICIOS", href: "#servicios" },
  { label: "BENEFICIOS", href: "#beneficios" },
  { label: "CLIENTES", href: "#clientes" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        width: "100%",
        zIndex: 50,
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "100px",
        }}
      >
        {/* Logo */}
        <a href="#inicio" style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/images/logo-cnp.png"
            alt="Centro Nacional de Pruebas"
            width={420}
            height={105}
            style={{ height: "120px", width: "auto" }}
            priority
          />
        </a>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 16px",
                fontSize: "15px",
                fontWeight: 700,
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                color: "#2969b0",
                textDecoration: "none",
                borderRadius: "6px",
                transition: "all 0.2s ease",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2969b0";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#2969b0";
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
