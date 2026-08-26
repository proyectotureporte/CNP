import type { Caso } from './types';

/**
 * Casos de éxito, en acordeón y en tres partes: problema · qué hicimos · resultado.
 *
 * El texto de "problema" y "qué hicimos" viene del sitio publicado. El
 * "resultado" NO está declarado en dos de los tres casos: no se inventa. Queda
 * marcado como pendiente hasta que lo redacte quien llevó el caso.
 */
export const casos: readonly Caso[] = [
  {
    cliente: 'Bancolombia',
    titulo: 'Controversia de dictámenes en audiencia',
    problema:
      'La contraparte aportó prueba técnica financiera que sostenía su pretensión, y había que discutirla dentro de la audiencia.',
    hicimos:
      'Controvertimos las pruebas técnicas de la contraparte en audiencia judicial, con consultores senior, asegurando una defensa sólida.',
    pendienteResultado: 'por redactar con el equipo del caso',
    abiertoPorDefecto: true,
  },
  {
    cliente: 'Universidad del Valle',
    titulo: 'Faltantes en la contabilidad de una compañía',
    problema:
      'Se sospechaban faltantes de dinero en la contabilidad de Industrias Wescold S.A.S. y había que determinar si existían y por cuánto.',
    hicimos:
      'Lideramos la investigación técnica, con el respaldo de consultores de nivel magíster, para garantizar precisión en un proceso de alto impacto económico.',
    pendienteResultado: 'por redactar con el equipo del caso',
  },
  {
    cliente: 'Banco Falabella',
    titulo: 'Revisión del dictamen de la parte demandante',
    problema:
      'La parte demandante presentó un dictamen pericial que sostenía la reclamación y que no se había examinado técnicamente.',
    hicimos:
      'Realizamos un análisis técnico profundo del dictamen presentado, identificando sus debilidades metodológicas.',
    resultado: 'Se facilitó la conciliación en audiencia, cerrando el proceso sin sentencia.',
  },
];
