"use client";

import { useEffect, useRef } from "react";

export function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    // Observe the element itself and all reveal children
    const targets = el.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger");
    targets.forEach((t) => observer.observe(t));
    if (el.classList.contains("reveal") || el.classList.contains("reveal-left") || el.classList.contains("reveal-right") || el.classList.contains("reveal-scale") || el.classList.contains("reveal-stagger")) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
