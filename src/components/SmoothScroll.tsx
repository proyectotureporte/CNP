"use client";

import { useEffect } from "react";

const HEADER_HEIGHT = 80;

export default function SmoothScroll() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href === "#") return;

      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT;
      window.scrollTo({ top, behavior: "smooth" });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
