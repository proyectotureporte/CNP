import type { IconoDisciplina } from '@/lib/content/home-unificado/types';

/**
 * Íconos de las materias periciales. Trazo, no relleno: escalan y recolorean.
 *
 * La clave viene del contenido y es una unión cerrada, así que agregar una
 * materia sin su ícono no compila.
 */
export function IconoMateria({ nombre }: { nombre: IconoDisciplina | 'otro' }) {
  const props = {
    width: 17,
    height: 17,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (nombre) {
    case 'finanzas':
      return <svg {...props}><path d="M3 20h18M6 20v-6M11 20V7M16 20v-9" /></svg>;
    case 'medicina':
      return <svg {...props}><path d="M3 12h4l2.5-6 4 13 2.5-7h5" /></svg>;
    case 'ingenieria':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        </svg>
      );
    case 'informatica':
      return <svg {...props}><rect x="2.5" y="4" width="19" height="13" rx="2" /><path d="M8 20h8" /></svg>;
    case 'grafologia':
      return <svg {...props}><path d="M3 21l3.6-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L3 21z" /></svg>;
    case 'industria':
      return <svg {...props}><path d="M2 20h20M4 20v-9l5 3v-3l5 3V6h5v14" /></svg>;
    case 'otro':
      return <svg {...props}><path d="M9.2 9a3 3 0 1 1 4.2 2.7c-.9.4-1.4 1.1-1.4 2.1M12 17.5h.01" /></svg>;
  }
}
