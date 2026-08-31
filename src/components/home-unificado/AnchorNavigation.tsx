'use client';

import { useEffect } from 'react';

function destinoDelHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  return id ? document.getElementById(id) : null;
}

/** Mantiene una duración breve y predecible para todas las anclas de la home. */
export function AnchorNavigation() {
  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>('.cnp-home');
    if (!raiz) return;

    const scrollBehaviorAnterior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    let animacion = 0;

    const desplazar = (hash: string, animar: boolean) => {
      const destino = destinoDelHash(hash);
      if (!destino) return false;

      window.cancelAnimationFrame(animacion);
      const inicio = window.scrollY;
      const final = Math.max(0, inicio + destino.getBoundingClientRect().top);
      const distancia = final - inicio;
      const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!animar || reducirMovimiento || Math.abs(distancia) < 2) {
        window.scrollTo({ top: final, behavior: 'auto' });
        return true;
      }

      const duracion = Math.min(480, Math.max(300, Math.abs(distancia) * 0.12));
      const comienzo = performance.now();
      const paso = (ahora: number) => {
        const progreso = Math.min(1, (ahora - comienzo) / duracion);
        const suavizado = 1 - Math.pow(1 - progreso, 4);
        window.scrollTo({ top: inicio + distancia * suavizado, behavior: 'auto' });
        if (progreso < 1) animacion = window.requestAnimationFrame(paso);
      };

      animacion = window.requestAnimationFrame(paso);
      return true;
    };

    const alPulsarAncla = (evento: MouseEvent) => {
      if (
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) return;

      const enlace = (evento.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!enlace || !raiz.contains(enlace)) return;
      const hash = enlace.getAttribute('href');
      if (!hash || !destinoDelHash(hash)) return;

      evento.preventDefault();
      if (window.location.hash !== hash) window.history.pushState(null, '', hash);
      desplazar(hash, true);
    };

    const alRecorrerHistorial = () => desplazar(window.location.hash, true);
    const inicial = window.requestAnimationFrame(() => desplazar(window.location.hash, false));

    raiz.addEventListener('click', alPulsarAncla);
    window.addEventListener('popstate', alRecorrerHistorial);

    return () => {
      window.cancelAnimationFrame(inicial);
      window.cancelAnimationFrame(animacion);
      document.documentElement.style.scrollBehavior = scrollBehaviorAnterior;
      raiz.removeEventListener('click', alPulsarAncla);
      window.removeEventListener('popstate', alRecorrerHistorial);
    };
  }, []);

  return null;
}
