"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Nosotros", href: "#quienes" },
  { label: "Nuestro equipo", href: "#equipo" },
  { label: "Contacto", href: "#contacto" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        display: "block",
        width: "100%",
        height: "80px",
        zIndex: 999,
        backgroundColor: "#0f3b85",
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.25)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "80px",
        }}
      >
        {/* Logo */}
        <a
          href="#inicio"
          onClick={() => setMenuOpen(false)}
          style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <Image
            src="/images/cnpblanco.png"
            alt="CNP"
            width={180}
            height={60}
            style={{ height: "85px", width: "auto" }}
            priority
          />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex" style={{ alignItems: "center", gap: "0" }}>
          {navItems.map((item, index) => (
            <span key={item.href} style={{ display: "flex", alignItems: "center" }}>
              <a
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "8px 16px",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                  color: "rgba(255,255,255,0.88)",
                  textDecoration: "none",
                  letterSpacing: "0.3px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.88)";
                }}
              >
                {item.label}
              </a>
              {index < navItems.length - 1 && (
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", userSelect: "none" }}>|</span>
              )}
            </span>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
          }}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            backgroundColor: "#0f3b85",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            padding: "16px 24px",
          }}
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: "15px",
                fontWeight: 600,
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                color: "#ffffff",
                textDecoration: "none",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
