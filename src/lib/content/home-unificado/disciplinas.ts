import type { Disciplina } from './types';

/**
 * Las seis disciplinas verificadas en peritus.com.co el 20-ago-2026.
 *
 * Esta banda es la fusión hecha visible: hoy, quien entra por cnp.com.co solo
 * ve la especialidad financiera y nunca se entera de las otras cinco.
 */
export const disciplinas: readonly Disciplina[] = [
  { nombre: 'Finanzas', alcance: 'Perjuicios, liquidaciones, contabilidad', icono: 'finanzas', principal: true },
  { nombre: 'Medicina', alcance: 'Valoración médico-legal', icono: 'medicina' },
  { nombre: 'Ingeniería', alcance: 'Obra, estructuras, avalúos', icono: 'ingenieria' },
  { nombre: 'Informática', alcance: 'Evidencia digital y sistemas', icono: 'informatica' },
  { nombre: 'Grafología', alcance: 'Documentoscopia y firmas', icono: 'grafologia' },
  { nombre: 'Industria', alcance: 'Procesos y maquinaria', icono: 'industria' },
];

export const redPeritus = {
  titulo: 'La red de peritos de CNP.',
  texto:
    'Seis disciplinas, un solo equipo y un solo estándar metodológico. Cuando el caso no es financiero, el dictamen lo firma un perito de la red — validado, con tarjeta profesional vigente y con el mismo formato de entrega.',
} as const;
