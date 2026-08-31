import type { Perfil } from '@/lib/content/home-unificado/types';

/**
 * ── Cuáles de estas entradas se pintan hoy ──
 *
 *   abogado · firma · empresa · juez  →  la pila de fichas de "A quién le
 *                                        servimos" (components/Trabajos.tsx)
 *   perito                            →  la franja del perito dentro de la red
 *                                        PERITUS (components/RedPeritus.tsx)
 *
 *   nosotros                          →  YA NO SE PINTA. "Quiénes somos" se
 *                                        reescribió con hechos comprobables en
 *                                        content/nosotros.ts, porque los cinco
 *                                        valores de aquí eran los mismos que
 *                                        publican Exponent y Envista.
 *   proceso                           →  YA NO SE PINTA. El proceso vive en
 *                                        content/metodologia.ts, dentro de
 *                                        "Cómo se sostiene".
 *
 * Las dos entradas muertas se conservan porque son el texto original del sitio
 * publicado y todavía no hay repositorio del que recuperarlo. Cuando esto entre
 * a git, se borran — y con ellas `perfil-nosotros.jpg` y `perfil-proceso.webp`,
 * que ya no los carga nadie.
 */

/**
 * Las siete pestañas del filtro.
 *
 * Reemplazan el selector "Soy abogado / soy empresa / soy juez", que dice quién
 * es el visitante y no qué vino a resolver. Por eso cada pestaña abre con el
 * trabajo enunciado en primera persona (Jobs to Be Done) y no con una categoría.
 *
 * Aquí vuelven a vivir los cinco servicios de alta especialidad —hoy publicados
 * dos veces en cnp.com.co—, la metodología, el proceso de cinco pasos y el
 * "quiénes somos". Nada se elimina del sitio: se reubica donde se pide.
 */
export const perfiles: readonly Perfil[] = [
  {
    id: 'abogado',
    pestana: 'Abogado litigante',
    imagen: {
      src: '/images/perfil-abogado.jpg',
      alt: 'Abogados revisando un contrato en una sala de juntas',
      ancho: 600,
      alto: 900,
    },
    enunciado: {
      eyebrow: 'Lo que viene a resolver',
      texto:
        'Necesito que un tercero técnico y creíble sostenga mi pretensión ante el juez, a tiempo para la audiencia, sin que se me caiga en contradicción.',
    },
    cuerpo: {
      clase: 'servicios',
      servicios: [
        {
          titulo: 'Cuantificación de perjuicios',
          descripcion: 'Cálculo técnico de lucro cesante y daño emergente con respaldo metodológico.',
        },
        {
          titulo: 'Revisión de dictamen de contraparte',
          descripcion: 'Análisis crítico y detección de errores técnicos en informes periciales externos.',
        },
        {
          titulo: 'Acompañamiento técnico en litigio',
          descripcion: 'Apoyo experto previo a la audiencia y en las etapas críticas del caso.',
        },
      ],
    },
    lateral: {
      titulo: 'Qué recibe exactamente',
      items: [
        { texto: 'Dictamen con la metodología declarada y cada dato rastreable hasta su fuente.' },
        { texto: 'Anexos de soporte con los cálculos abiertos, no solo el resultado.' },
        { texto: 'Acompañamiento del perito a la audiencia de contradicción.' },
        { texto: 'Alcance y fecha de entrega por escrito antes de empezar.' },
      ],
    },
    faqs: [
      {
        pregunta: '¿Cuánto tarda un dictamen?',
        respuesta:
          'El plazo se compromete por escrito en la propuesta de alcance, antes de iniciar el análisis.',
      },
      {
        pregunta: '¿El perito asiste a la audiencia?',
        respuesta:
          'Sí. El acompañamiento técnico en audiencia es parte del servicio, no un cobro aparte del dictamen.',
      },
    ],
  },

  {
    id: 'firma',
    pestana: 'Firma de abogados',
    imagen: {
      src: '/images/perfil-firma.webp',
      alt: 'Equipo jurídico analizando en conjunto un documento del expediente',
      ancho: 1800,
      alto: 1200,
    },
    enunciado: {
      eyebrow: 'Lo que viene a resolver',
      texto:
        'Necesito un proveedor técnico confiable al que pueda mandarle casos de forma repetida sin volver a explicar cómo trabajamos.',
    },
    cuerpo: {
      clase: 'servicios',
      servicios: [
        {
          titulo: 'Diagnóstico probatorio-financiero',
          descripcion:
            'Análisis inicial del caso para identificar necesidades técnicas, riesgos y alcance del dictamen.',
        },
        {
          titulo: 'Informe de cuantificación de daños',
          descripcion:
            'Cuantificación técnica y soportada del daño material —lucro cesante y daño emergente— y moral.',
        },
        {
          titulo: 'Segunda opinión experta',
          descripcion:
            'Validación independiente de la evidencia existente para fortalecer la estrategia probatoria.',
        },
      ],
    },
    lateral: {
      titulo: 'Qué recibe exactamente',
      items: [
        { texto: 'Un solo interlocutor para todas las disciplinas, sin buscar perito caso por caso.' },
        { texto: 'Diagnóstico previo que dice si el peritaje conviene, antes de contratarlo.' },
        { texto: 'Formato de entrega estable entre casos, para no reaprenderlo cada vez.' },
        { texto: 'Confidencialidad y manejo seguro de la información de cada expediente.' },
      ],
    },
    faqs: [
      {
        pregunta: '¿Se puede trabajar por volumen?',
        respuesta: 'Sí. Las condiciones se ajustan según el volumen y la frecuencia de casos de la firma.',
      },
      {
        pregunta: '¿Firman acuerdo de confidencialidad?',
        respuesta:
          'Sí. La confidencialidad y el manejo seguro de la información de cada caso son parte del encargo.',
      },
    ],
  },

  {
    id: 'empresa',
    pestana: 'Empresa',
    imagen: {
      src: '/images/perfil-empresa.jpg',
      alt: 'Asesor explicando cifras financieras a una clienta',
      ancho: 600,
      alto: 900,
    },
    enunciado: {
      eyebrow: 'Lo que viene a resolver',
      texto:
        'Necesito saber cuánto vale realmente el daño que me hicieron, en un número que aguante ser discutido.',
    },
    cuerpo: {
      clase: 'servicios',
      servicios: [
        {
          titulo: 'Análisis económico de incumplimiento',
          descripcion: 'Determinación del impacto financiero derivado de rupturas contractuales.',
        },
        {
          titulo: 'Revisión de liquidaciones',
          descripcion: 'Auditoría técnica de préstamos, intereses y estructuras financieras en litigio.',
        },
        {
          titulo: 'Valoración de pruebas financieras',
          descripcion: 'Interpretación y análisis de documentos contables complejos para el tribunal.',
        },
      ],
    },
    lateral: {
      titulo: 'Qué recibe exactamente',
      items: [
        { texto: 'Una cifra defendible, con el método y los supuestos a la vista.' },
        { texto: 'Análisis técnico para disputas contractuales y litigios corporativos.' },
        { texto: 'Documento que su abogado puede aportar al proceso sin reescribirlo.' },
        { texto: 'Independencia declarada: el hallazgo no cambia según quién contrate.' },
      ],
    },
    faqs: [
      {
        pregunta: '¿Sirve antes de demandar?',
        respuesta:
          'Sí. El diagnóstico previo se usa justamente para decidir si vale la pena litigar y por cuánto.',
      },
      {
        pregunta: '¿Y si el daño no es financiero?',
        respuesta:
          'Se asigna un perito de la disciplina que corresponda dentro de la red PERITUS —ingeniería, informática, industria— con el mismo estándar.',
      },
    ],
  },

  {
    id: 'juez',
    pestana: 'Juez',
    imagen: {
      src: '/images/perfil-juez.jpg',
      alt: 'Fachada neoclásica de un juzgado, con una persona subiendo las escaleras de entrada',
      ancho: 760,
      alto: 1147,
      // Sube el recorte hasta el frontón: centrada, la caja 4:3 solo mostraría muro.
      posicion: 'center 20%',
    },
    enunciado: {
      eyebrow: 'Lo que viene a resolver',
      texto: 'Necesito un tercero imparcial que me traduzca lo técnico sin inclinar el resultado.',
    },
    cuerpo: {
      clase: 'servicios',
      servicios: [
        {
          titulo: 'Dictamen pericial',
          descripcion:
            'Esclarecimiento de puntos técnicos y científicos para establecer la verdad procesal.',
        },
        {
          titulo: 'Valoración del acervo probatorio',
          descripcion: 'Análisis técnico de documentos, soportes y evidencias de carácter financiero.',
        },
        {
          titulo: 'Claridad de exposición',
          descripcion: 'Conclusiones diseñadas para ser comprendidas y valoradas por el despacho.',
        },
      ],
    },
    lateral: {
      titulo: 'Qué recibe exactamente',
      items: [
        { texto: 'Análisis basados en métodos estandarizados y verificables.' },
        { texto: 'Trazabilidad completa: cada dato y cada paso analítico, comprobables.' },
        { texto: 'Peritos con tarjeta profesional vigente, conforme al art. 226 del CGP.' },
        { texto: 'Conclusiones sin ambigüedades, enfocadas en el hallazgo técnico.' },
      ],
    },
    faqs: [
      {
        pregunta: '¿Cubren todo el país?',
        respuesta:
          'Sí. Operamos en todo el territorio colombiano, sin restricción por la ubicación del despacho.',
      },
    ],
  },

  {
    id: 'nosotros',
    pestana: 'Nosotros',
    imagen: {
      src: '/images/perfil-nosotros.jpg',
      alt: 'Tres profesionales revisando gráficas financieras sobre una mesa de trabajo',
      ancho: 900,
      alto: 600,
    },
    enunciado: {
      eyebrow: 'Quiénes somos',
      texto:
        'Contribuimos a que las decisiones jurídicas se fundamenten en análisis técnico sólido, evidencia confiable y rigor profesional.',
    },
    cuerpo: {
      clase: 'texto',
      parrafos: [
        'Centro Nacional de Pruebas es una firma especializada en dictámenes periciales y valoración técnica de pruebas, que apoya a abogados, jueces, magistrados y empresas en la comprensión de asuntos complejos dentro de procesos judiciales.',
        'Con más de diez años de experiencia, entregamos análisis independientes y técnicamente rigurosos, convirtiendo información compleja en dictámenes claros y comprensibles que facilitan la valoración de la prueba.',
      ],
    },
    lateral: {
      titulo: 'Nuestros valores',
      items: [
        {
          destacado: 'Precisión.',
          texto: 'Dictámenes elaborados con metodologías profesionales y sustento técnico verificable.',
        },
        {
          destacado: 'Puntualidad.',
          texto: 'Tiempos de respuesta que se ajustan a los plazos procesales de cada caso.',
        },
        {
          destacado: 'Independencia y objetividad.',
          texto: 'Análisis imparciales que fortalecen la credibilidad de la prueba.',
        },
        {
          destacado: 'Claridad probatoria.',
          texto: 'Transformamos información compleja en análisis comprensibles para el proceso.',
        },
        {
          destacado: 'Rigor.',
          texto: 'Análisis exhaustivo con sustento técnico que respalda cada conclusión.',
        },
      ],
    },
  },

  {
    id: 'proceso',
    pestana: 'El proceso',
    imagen: {
      src: '/images/perfil-proceso.webp',
      alt: 'Presentación de un análisis financiero ante un equipo',
      ancho: 1797,
      alto: 1200,
    },
    enunciado: {
      eyebrow: 'Cómo trabajamos',
      texto:
        'Un proceso claro, técnico y organizado, para que cada hallazgo técnico se convierta en prueba utilizable.',
    },
    cuerpo: {
      clase: 'pasos',
      pasos: [
        {
          titulo: 'Recibimos el caso.',
          descripcion: 'Comprendemos el contexto, la etapa procesal y el objetivo probatorio.',
        },
        {
          titulo: 'Evaluamos la necesidad técnica.',
          descripcion:
            'Determinamos si se requiere un peritaje, una revisión, una valoración o una estrategia probatoria.',
        },
        {
          titulo: 'Presentamos el alcance y la metodología.',
          descripcion: 'Explicamos qué se hará, cómo y el plazo de entrega. Aquí se compromete la fecha.',
        },
        {
          titulo: 'Realizamos el análisis pericial.',
          descripcion:
            'Desarrollamos la opinión pericial o la intervención técnica con una metodología estructurada.',
        },
        {
          titulo: 'Entregamos la evidencia de respaldo.',
          descripcion: 'Conclusiones claras, rastreables y útiles para el litigio.',
        },
      ],
    },
    lateral: {
      titulo: 'Enfoque y metodología',
      items: [
        {
          destacado: 'Rigor científico.',
          texto: 'Análisis basados en métodos estandarizados y verificables.',
        },
        {
          destacado: 'Claridad de exposición.',
          texto: 'Conclusiones diseñadas para ser comprendidas y valoradas por el juez.',
        },
        {
          destacado: 'Trazabilidad completa.',
          texto: 'Transparencia de cada dato y de cada proceso analítico.',
        },
      ],
    },
  },

  {
    id: 'perito',
    pestana: 'Trabaja con nosotros',
    imagen: {
      src: '/images/perfil-perito.jpg',
      alt: 'Mesa de trabajo pericial con balanza de justicia, radiografías, microscopio e instrumental forense',
      ancho: 600,
      alto: 900,
    },
    enunciado: {
      eyebrow: 'Lo que viene a resolver',
      texto:
        'Quiero que mi conocimiento técnico me genere ingresos sin tener que salir a conseguir clientes yo mismo.',
    },
    cuerpo: {
      clase: 'pasos',
      pasos: [
        {
          titulo: 'Se registra y sube sus documentos.',
          descripcion: 'Hoja de vida, tarjeta profesional vigente y datos de contacto.',
        },
        {
          titulo: 'Validamos disciplina y documentación.',
          descripcion:
            'Verificamos la tarjeta profesional que exige el art. 226 del CGP y clasificamos su disciplina.',
        },
        {
          titulo: 'Recibe casos en su panel.',
          descripcion: 'Le llegan los casos de su disciplina, con el objeto del dictamen y la fecha de entrega.',
        },
        {
          titulo: 'Acepta o rechaza con criterio.',
          descripcion: 'Ve el alcance y la remuneración antes de comprometerse.',
        },
      ],
    },
    lateral: {
      titulo: 'Qué necesita para entrar',
      items: [
        { texto: 'Tarjeta profesional vigente de su disciplina.' },
        { texto: 'Hoja de vida con trayectoria pericial o técnica.' },
        { texto: 'Datos bancarios para el pago de honorarios.' },
        { texto: 'Disponibilidad declarada, que usted mismo actualiza.' },
      ],
      nota: 'El material formativo —videos e instructivos sobre qué es un dictamen pericial y cómo se elabora— vive dentro del panel, no en la web pública: se entrega a quien ya se registró.',
      cta: { texto: 'Registrarme como perito', href: '/crm/registro-perito' },
    },
  },
];
