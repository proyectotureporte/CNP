"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
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
        backgroundColor: "#ffffff",
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
            src="/images/logo-cnp.png"
            alt="CNP"
            width={180}
            height={60}
            style={{ height: "80px", width: "auto" }}
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
                  fontSize: "18px",
                  fontWeight: 600,
                  fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                  color: "#1a1a2e",
                  textDecoration: "none",
                  letterSpacing: "0.3px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0a2a6e";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#1a1a2e";
                }}
              >
                {item.label}
              </a>
              {index < navItems.length - 1 && (
                <span style={{ color: "#cbd5e1", fontSize: "14px", userSelect: "none" }}>|</span>
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a2a6e" strokeWidth="2" strokeLinecap="round">
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
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e2e8f0",
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
                color: "#1a1a2e",
                textDecoration: "none",
                borderBottom: "1px solid #f1f5f9",
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
