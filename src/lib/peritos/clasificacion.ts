// Clasificación automática de peritos (PDF "Estructura de Clasificación de Peritos").
// Función PURA y portable (sin dependencias de DB ni de tipos del proyecto), para
// usarse igual en el registro web (PERITUS) y al reclasificar en el CRM (CNP).

export type Seniority = 'junior' | 'senior' | 'master';

export type ExperienceRange = 'menos_2' | '2_4' | '4_8' | 'mas_8';

export const EXPERIENCE_RANGES: { value: ExperienceRange; label: string }[] = [
  { value: 'menos_2', label: 'Menos de 2 años' },
  { value: '2_4', label: 'De 2 a 4 años' },
  { value: '4_8', label: 'Más de 4 y hasta 8 años' },
  { value: 'mas_8', label: 'Más de 8 años' },
];

/** Año representativo del rango (para expert.experience_years, que es INTEGER). */
export function experienceRangeToYears(r: ExperienceRange): number {
  switch (r) {
    case 'menos_2': return 1;
    case '2_4': return 3;
    case '4_8': return 6;
    case 'mas_8': return 10;
    default: return 0;
  }
}

export interface FormacionInput {
  pregrado: boolean;
  numEspecializaciones: number;
  numMaestrias: number;
  doctorado: boolean;
  experiencia: ExperienceRange;
}

/**
 * Primera estimación del seniority. La clasificación DEFINITIVA la confirma o
 * ajusta el equipo en la fase de evaluación (validación humana — PDF §9).
 *
 *  - Junior: pregrado + 1 especialización + experiencia 2-4 años.
 *  - Senior: pregrado + (2 especializaciones o 1 maestría) + >4 y hasta 8 años.
 *  - Master: pregrado + (3 especializaciones, 2 maestrías o doctorado) + >8 años.
 *    A un Master NO se le exige experiencia judicial previa (se forma
 *    internamente), por eso su formación prima aunque declare menos experiencia.
 *
 * Devuelve null si no cumple el mínimo de admisión (pregrado + 1 especialización).
 */
export function clasificarSeniority(f: FormacionInput): Seniority | null {
  if (!f.pregrado) return null;

  const formacionMaster = f.numEspecializaciones >= 3 || f.numMaestrias >= 2 || f.doctorado;
  const formacionSenior = f.numEspecializaciones >= 2 || f.numMaestrias >= 1;

  // Coincidencia formación × experiencia declarada
  if (formacionMaster && f.experiencia === 'mas_8') return 'master';
  if (formacionSenior && f.experiencia === '4_8') return 'senior';
  if (f.numEspecializaciones >= 1 && f.experiencia === '2_4') return 'junior';

  // Fallbacks por formación (la experiencia se confirma en evaluación)
  if (formacionMaster) return 'master';
  if (formacionSenior) return 'senior';
  if (f.numEspecializaciones >= 1) return 'junior';

  return null; // pregrado sin especialización → no cumple el mínimo
}
