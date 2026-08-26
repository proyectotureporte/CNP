import Image from 'next/image';
import { disciplinas } from '@/lib/content/home-unificado/disciplinas';
import type { IconoDisciplina } from '@/lib/content/home-unificado/types';

/**
 * Lado derecho del hero: foto recortada + tarjeta flotante.
 *
 * Es el mismo patrón que ya usa restaurar.co, por pedido de Santiago
 * (25-ago-2026): una persona sobre fondo transparente y, encima, una tarjeta
 * de interfaz que muestra el resultado. Allá la tarjeta dice "Crédito
 * restaurado"; aquí dice qué disciplinas quedan cubiertas, que es el argumento
 * de la fusión.
 *
 * La tarjeta es DOM, no imagen: se lee en un lector de pantalla, escala con el
 * texto y se edita sin abrir un editor gráfico.
 *
 * La foto salió de un retrato de estudio sobre fondo blanco al que se le quitó
 * el fondo por inundación desde los bordes. Detalle que importa si hay que
 * repetirlo: un umbral global le habría abierto huecos a la camisa blanca.
 */
export function HeroMedia() {
  return (
    <div className="hero-media">
      {/*
        Nota para quien lo toque: el optimizador de Next reduce este PNG RGBA de
        335 KB a 80 KB, pero lo hace pasándolo a paleta de 104 colores con 23
        niveles de transparencia. A 600 px de alto se ve bien; si alguna vez
        aparece escalonado el borde del recorte contra el azul, la salida es
        agregarle `unoptimized` — a costa de esos 255 KB.
      */}
      <Image
        className="hero-foto"
        src="/images/hero-perito.png"
        alt="Abogado de traje, de brazos cruzados"
        width={417}
        height={900}
        priority
      />

      <aside className="tarjeta-red" aria-label="Disciplinas que cubre la red">
        <h2 className="tarjeta-red__titulo">
          Disciplinas <span className="acento">cubiertas</span>
        </h2>

        <ul className="tarjeta-red__lista">
          {disciplinas.map((disciplina) => (
            <li key={disciplina.nombre} className="tarjeta-red__item">
              <span className="tarjeta-red__ico">
                <IconoDeDisciplina nombre={disciplina.icono} />
              </span>
              {disciplina.nombre}
              <Check />
            </li>
          ))}
        </ul>

        <a className="tarjeta-red__pie" href="#servicios">
          Ver la red PERITUS <span aria-hidden="true">↗</span>
        </a>
      </aside>
    </div>
  );
}

const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function IconoDeDisciplina({ nombre }: { nombre: IconoDisciplina }) {
  switch (nombre) {
    case 'finanzas':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" {...trazo}>
          <path d="M3 20h18M6 20v-6M11 20V7M16 20v-9" />
        </svg>
      );
    case 'medicina':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" {...trazo}>
          <path d="M3 12h4l2.5-6 4 13 2.5-7h5" />
        </svg>
      );
    case 'ingenieria':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" {...trazo}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        </svg>
      );
    case 'informatica':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" {...trazo}>
          <rect x="2.5" y="4" width="19" height="13" rx="2" />
          <path d="M8 20h8" />
        </svg>
      );
    case 'grafologia':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" {...trazo}>
          <path d="M3 21l3.6-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L3 21z" />
        </svg>
      );
    case 'industria':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" {...trazo}>
          <path d="M2 20h20M4 20v-9l5 3v-3l5 3V6h5v14" />
        </svg>
      );
  }
}

function Check() {
  return (
    <svg className="tarjeta-red__check" width="15" height="15" viewBox="0 0 24 24" {...trazo}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}
