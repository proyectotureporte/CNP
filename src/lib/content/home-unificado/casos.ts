import type { Caso } from '@/lib/content/home-unificado/types';

/**
 * Los casos, con nombre propio — y con radicado verificado.
 *
 * ── Qué reemplazó, y de dónde vienen los 10 ──
 * Antes había tres casos sacados del sitio publicado, y en dos de los tres el
 * campo "resultado" estaba en amarillo porque nadie lo había redactado.
 * Nueve de estos diez vienen del brochure de la casa. El décimo (folio '13',
 * el de Cúcuta) viene de otra fuente: la hoja de vida del perito, que él
 * mismo entregó (27-ago-2026) describiendo su designación como Auxiliar de
 * la Justicia. Los dos documentos se cruzan entre sí y contra la Rama.
 *
 * ── Los radicados: de dónde salieron y qué se corrigió con ellos ──
 * Se verificaron uno por uno contra la API pública de la Rama Judicial
 * (`consultaprocesos.ramajudicial.gov.co`, endpoints `NombreRazonSocial` y
 * `Detalle`), cruzando el nombre de las partes contra el despacho y la fecha
 * de cada fuente. NINGÚN radicado se puso por coincidencia de nombre sola:
 * cada caso se revisó uno por uno y solo se aceptó el cruce cuando encajaban
 * partes + despacho + fecha a la vez.
 *
 * La verificación destapó DOS datos que el brochure de la casa tenía mal:
 *
 *  · **Falabella.** El sitio publicado decía que el cliente era Banco
 *    Falabella; el brochure decía "CNP por la parte actora". Los dos no podían
 *    ser ciertos a la vez. La Rama confirma que el demandado es Banco
 *    Falabella S.A. y que Pedro Nel Jaramillo Cruz es el demandante — el
 *    brochure tenía razón. Se corrige el nombre de la contraparte al exacto
 *    que usa el proceso.
 *  · **Rosana Miranda / Wescold.** El brochure titulaba "Rosana Miranda
 *    contra Industrias Wescold". El proceso real es al revés: Industrias
 *    Wescold (con otro demandante) contra Rosana Miranda Castro. Tiene más
 *    sentido con el objeto del dictamen —"faltantes... atribuibles a la parte
 *    demandada"— si la demandada es la persona a quien se le atribuyen los
 *    faltantes. Se corrige la dirección del título.
 *
 * Y una que se resuelve a favor de la fuente pública: el despacho del caso de
 * Jorge Eugenio Correa Henao no es "Civil del Circuito" como decía el
 * brochure, sino Civil MUNICIPAL de Cali. Se revisaron los 28 procesos de ese
 * nombre y no hay ninguno a nivel Circuito contra Energéticos.
 *
 * ── Fortox, resuelto ──
 * Ya no se quedó sin explicación: la hoja de vida del perito confirma que fue
 * un trámite ante el Centro de Conciliación FUNDAFAS, no un proceso judicial
 * — por eso 40 búsquedas contra la Rama nunca iban a encontrar nada. Trae
 * además el nombre real de "el sindicato": SINTRAVASEP.
 *
 * ── Dos datos de la hoja de vida que NO se incorporaron, y por qué ──
 * La hoja de vida se contradice a sí misma en un mismo párrafo (llama a una
 * demandada "Marisol Segura" y tres líneas después "Marisol Castro"; llama al
 * mismo despacho "Tribunal Superior de Cali" y "juzgado civil del circuito de
 * Cali"). Es una fuente útil, pero no una fuente sin errores de transcripción.
 * Donde contradice lo ya verificado por radicado exacto contra la Rama
 * (la dirección de la demanda de Falabella, el despacho de Correa Henao), se
 * mantiene el dato de la Rama. El detalle de cada caso lo explica en su sitio.
 *
 * ── Lo que NO se afirma ──
 * Ningún caso declara un resultado salvo el de Falabella, y no se les inventa
 * uno a los demás. El lineamiento de marca de PERITUS prohíbe presentarse como
 * quien garantiza el resultado de un proceso, y una auditoría de 20 sitios de
 * la competencia mostró que nadie del mercado puede sostener una tasa de
 * éxito: hace falta el denominador —en cuántos casos el dictamen fue acogido y
 * en cuántos rebatido— que CNP todavía no ha medido.
 *
 * ── La clasificación ──
 * `tipo` es el argumento de la sección: la casa no solo calcula daños,
 * también desarma el cálculo del otro, y ese es un servicio que el sitio ya
 * vende ("Revisión de dictamen de contraparte") y que hasta ahora no tenía con
 * qué probarse. Se clasificó por lo que dice literalmente el objeto:
 *   · `contradiccion`  — "evidenciar / determinar errores técnicos"
 *   · `verificacion`   — "verificar" si el perjuicio reclamado existe
 *   · `cuantificacion` — "calcular / determinar" el daño
 *
 * El conteo del titular y de los filtros se calcula del arreglo, no está
 * escrito a mano: si se reclasifica un caso, cambia solo en toda la sección.
 *
 * ── Numeración ──
 * `folio` guarda el número real del brochure (04-12), pero ya NO se muestra
 * en pantalla ("CNP-04" leía como una referencia de sistema interno, no como
 * algo para un abogado o un cliente) — hoy solo es la key del listado. Se
 * conserva sin renumerar a 01-09 porque, aunque el lector ya no lo vea, sigue
 * siendo la prueba de que esto es una muestra y no el inventario completo, y
 * renumerar habría sugerido justo lo contrario si algún día vuelve a
 * mostrarse. El folio '13' (Cúcuta) es la única excepción: no viene de
 * ningún documento, es continuación editorial nuestra — ver el comentario en
 * ese caso.
 *
 * ── PENDIENTE de confirmar antes de publicar ──
 * Los nombres de los abogados que remitieron cada caso salen del brochure o
 * de la hoja de vida del perito. Esos documentos van a un destinatario
 * concreto; una web pública, a cualquiera. Hay que pedirles permiso, o dejar
 * solo el juzgado y el radicado —que son registro público y ya son la prueba
 * más fuerte que hay.
 */
export const casos: readonly Caso[] = [
  {
    folio: '04',
    partes: 'Fortox Security Group contra SINTRAVASEP',
    tipo: 'cuantificacion',
    objeto:
      'Determinación y cálculo de los perjuicios causados por la pérdida de contratos de servicios a raíz de las manifestaciones realizadas por el sindicato de la compañía en instalaciones de un cliente.',
    fecha: 'Año 2022',
    /*
      Por qué no tiene radicado, y ahora se sabe con certeza en vez de
      suponerlo: la hoja de vida del perito trae el dato completo. No fue un
      proceso judicial — fue un trámite ante el Centro de Conciliación
      FUNDAFAS, con SINTRAVASEP (el sindicato de transportadores de valores y
      guardas de seguridad privada) como convocado. Los centros de
      conciliación no publican en la Rama Judicial: no es que no se
      encontrara, es que no hay nada que buscar ahí.
    */
    despacho: 'Centro de Conciliación FUNDAFAS',
  },
  {
    folio: '05',
    partes: 'Café del Eje contra Diproyco S.A.S.',
    tipo: 'contradiccion',
    objeto:
      'Evidenciar los errores técnicos del estudio financiero y del juramento estimatorio del dictamen de la demanda, con acompañamiento a audiencia para su sustentación.',
    fecha: 'Junio 2022',
    despacho: 'Juzgado 25 Civil del Circuito de Bogotá',
    radicado: '11001310302420200021400',
    instancia: 'Con actuación posterior ante el Tribunal Superior de Bogotá.',
    abogado: { titulo: 'Abogado', nombre: 'Diego Torres' },
  },
  {
    folio: '06',
    partes: 'Pedro Nel Jaramillo Cruz contra Banco Falabella S.A.',
    tipo: 'contradiccion',
    objeto:
      'Análisis del dictamen pericial presentado en la demanda para determinar errores técnicos en el dictamen allegado por la parte demandada.',
    despacho: 'Juzgado 11 Civil del Circuito de Cali',
    radicado: '76001310301120210007700',
    lado: 'CNP por la parte actora',
    /*
      El ÚNICO resultado declarado en todo el material de la casa. No dice que
      se ganó: dice que se concilió y el proceso se cerró sin sentencia. La
      fecha de última actuación verificada en la Rama (jun-2022) coincide con
      la fecha del brochure para el caso anterior — compatible con el cierre.

      ⚠️ La hoja de vida del perito (27-ago-2026) da la dirección AL REVÉS:
      "Demandante Banco Falabella S.A.S ... Demandado Pedro Nel Jaramillo
      Cruz". Se mantiene la dirección de la Rama (Jaramillo Cruz demandante,
      Falabella demandado) porque es fuente primaria oficial ya verificada por
      radicado exacto, y porque esa misma hoja de vida se contradice a sí
      misma en otro punto (el caso de Correa Henao, más abajo, dice a la vez
      "Tribunal Superior de Cali" y "Juzgado Civil del Circuito de Cali", y
      nombra a la demandada una vez "Marisol Segura" y otra "Marisol Castro")
      — no es una fuente sin errores de transcripción.
    */
    resultado: 'Se facilitó la conciliación en audiencia, cerrando el proceso sin sentencia.',
    insignia: 'Con resultado',
  },
  {
    folio: '07',
    partes: 'Gil Médica contra el Estado',
    tipo: 'verificacion',
    objeto:
      'Verificar y calcular los perjuicios financieros solicitados. Del lado demandado: Ministerio de la Protección Social, Ministerio de Hacienda y Crédito Público, Departamento Administrativo de la Función Pública y la ESE Antonio Nariño en liquidación.',
    despacho: 'Tribunal Contencioso Administrativo del Valle',
    radicado: '76001333101120090036201',
    abogado: { titulo: 'Abogada', nombre: 'Ayda Milena Navia Castillo' },
  },
  {
    folio: '08',
    partes:
      'Hernán Jaramillo Ángel & Cía. Ltda., Hernán Jaramillo Ángel e Inmobiliaria Villanueva contra Bancolombia',
    tipo: 'verificacion',
    objeto:
      'Verificar financieramente la existencia de perjuicios a instancias de un crédito hipotecario, por cuenta del proceso ejecutivo.',
    despacho: 'Juzgado 11 Civil del Circuito de Cali',
    radicado: '76001310301120160007500',
    abogado: { titulo: 'Abogado', nombre: 'David Sandoval Sandoval' },
  },
  {
    folio: '09',
    partes: 'Codelta Ltda. contra Linde Colombia',
    tipo: 'cuantificacion',
    objeto: 'Calcular los perjuicios y la cesantía comercial por terminación de contrato.',
    despacho: 'Juzgado 16 Civil del Circuito de Cali',
    radicado: '76001310300820120056700',
    /*
      Linde Colombia se llamaba AGA Fano hasta hace pocos años — la Rama trae
      ambos nombres cruzados en el mismo expediente. El proceso llegó a
      casación en la Corte Suprema (radicado relacionado, mismo expediente).
    */
    instancia: 'Con casación ante la Corte Suprema de Justicia.',
    abogado: { titulo: 'Abogado', nombre: 'David Sandoval Sandoval' },
  },
  {
    folio: '10',
    partes: 'Jorge Eugenio Correa Henao contra Energéticos S.A.S. E.S.P.',
    tipo: 'contradiccion',
    objeto:
      'Evidenciar los errores técnicos del estudio financiero y del juramento estimatorio del dictamen de la demanda.',
    despacho: 'Juzgado 23 Civil Municipal de Cali',
    radicado: '76001400302320170054000',
    abogado: { titulo: 'Abogado', nombre: 'Vladimir Jiménez Puerta' },
    /*
      La hoja de vida del perito (27-ago-2026) trae el mismo caso pero se
      contradice a sí misma en un solo párrafo: dice "Tribunal Superior de
      Cali" y, tres líneas después, "juzgado civil del circuito de Cali" — ni
      coincide entre sí, ni con el despacho ya verificado arriba (Municipal,
      no Circuito). También nombra a la demandada una vez "Marisol Segura" y
      otra "Marisol Castro", sin mencionar a Energéticos. No se incorpora ese
      nombre: no hay forma de conciliarlo con el radicado ya verificado, que
      trae a Energéticos S.A.S. E.S.P. como demandada, sin ninguna "Marisol".
    */
  },
  {
    folio: '11',
    partes: 'Industrias Wescold S.A.S. contra Rosana Miranda Castro',
    tipo: 'cuantificacion',
    objeto:
      'Calcular los faltantes de dinero en la contabilidad de la empresa atribuibles a la parte demandada.',
    despacho: 'Juzgado 30 Civil Municipal de Cali',
    radicado: '76001400303020200046000',
    instancia: 'Con apelación ante el Tribunal Superior de Cali.',
    /*
      El sitio publicado trae este mismo caso con la Universidad del Valle como
      cliente y dice, textualmente, que los faltantes eran "en la contabilidad
      de Industrias Wescold S.A.S." — es decir, el caso 11 del brochure y el
      caso de Univalle del sitio son el mismo, contado desde dos lados.
    */
    cliente: 'Universidad del Valle',
  },
  {
    folio: '12',
    partes: 'Innmac S.A.S. contra Eléctricas de Medellín Comercial S.A.S.',
    tipo: 'cuantificacion',
    objeto:
      'Determinar los daños y perjuicios ocasionados por la demandada al no cumplir con los objetos y cláusulas del contrato firmado y ratificado.',
    despacho: 'Juzgado 9 Civil del Circuito de Medellín',
    radicado: '05001310300920220021600',
    instancia: 'Con apelación ante el Tribunal Superior de Medellín.',
  },
  {
    /*
      El único caso de este arreglo que NO viene del brochure de 9 casos: sale
      de la hoja de vida del perito (27-ago-2026), que describe su
      designación como Auxiliar de la Justicia. El folio '13' es continuación
      editorial nuestra —no un número que traiga ningún documento fuente—
      igual que el resto de los folios tampoco son un radicado, son la
      referencia de expediente que usa este sitio.
    */
    folio: '13',
    partes: 'Unión Temporal Dadle Vosotros de Comer contra Municipio de San José de Cúcuta',
    tipo: 'cuantificacion',
    objeto:
      'Determinar el monto de los descuentos realizados por el municipio, tanto en cantidades de raciones completas no reconocidas como en valores parciales descontados de los pagos.',
    fecha: 'Año 2022',
    despacho: 'Tribunal de Arbitramento, Cámara de Comercio de Cúcuta',
    /*
      El arbitraje mismo es privado y no tiene radicado propio en la Rama —
      por eso el resto de los casos de esta fuente (como Fortox, arriba) no
      llevan uno. Pero ESTE sí tiene un radicado público real: el del recurso
      extraordinario de anulación del laudo, verificado contra la Rama.
      `Detalle` del proceso confirma exacto: claseProceso "LEY 1437 RECURSO DE
      ANULACION DE LAUDO ARBITRAL", y el contenido de la radicación dice
      textual que el laudo se profirió el 14-oct-2022 por el Tribunal de
      Arbitramento del Centro de Arbitraje y Conciliación de la Cámara de
      Comercio de Cúcuta, entre estas mismas dos partes — coincide justo con
      lo que describe la hoja de vida del perito.
    */
    radicado: '11001032600020230002300',
    radicadoNota: 'Del recurso de anulación del laudo, no del arbitraje mismo — el arbitraje es privado y no tiene radicado propio.',
    instancia: 'El laudo del 14-oct-2022 fue recurrido en anulación por las dos partes ante el Consejo de Estado, Sección Tercera.',
    /*
      El dato más fuerte de los 10: el perito no lo trajo ninguna de las
      partes — lo designó el propio tribunal arbitral. Es el mismo argumento
      de independencia que ya se construyó en "Quiénes somos" ("El hallazgo
      no cambia según quién contrate"), pero aquí probado con un caso real.
    */
    insignia: 'Designado por el tribunal',
  },
];

export const casosHead = {
  eyebrow: 'Casos con nombre propio',
  /**
   * "Algunos" y no "los" — internamente sabemos que hubo casos antes del
   * folio 04 (ver "Numeración" arriba), aunque esa numeración ya no se
   * muestre. Decir "nueve procesos" a secas, sin más, es lo que hacía que la
   * lista se leyera como si fuera el inventario completo.
   */
  titulo: 'Algunos de los procesos que hemos sostenido, con el radicado a la vista.',
  /**
   * El `{n}` lo reemplaza el componente con la cuenta real de casos de
   * contradicción. Escribir el número a mano es la forma más fácil de que la
   * frase quede mintiendo el día que alguien reclasifique un caso.
   */
  bajada:
    'En {n} de estos, el encargo no era calcular el daño: era demostrar que el cálculo del otro estaba mal. Es un trabajo distinto y casi nadie lo nombra.',
  /**
   * ── Por qué esta frase es corta, y qué NO dice ──
   * Antes había un párrafo largo explicándole al abogado por qué no se
   * declara una tasa de éxito ("solo 1 de 9 tiene resultado... sin saber en
   * cuántos dictámenes la conclusión fue acogida, nadie puede hablar de tasa
   * de éxito"). Es un razonamiento correcto, pero es una justificación
   * INTERNA — el tipo de cosa que se explica en una reunión de equipo, no
   * algo que un abogado necesita que le expliquen en la propia página. Leído
   * por el cliente sonaba defensivo, como si el sitio se estuviera
   * disculpando antes de que preguntaran.
   *
   * La misma honestidad queda intacta sin decirla en voz alta: la estructura
   * ya la comunica sola — de nueve tarjetas, solo una muestra "Resultado".
   * Nadie tiene que explicarle a un abogado que ocho no lo traen; lo ve.
   *
   * Lo único que de verdad le sirve al lector es dónde verificar, y eso sí
   * queda dicho, en una frase.
   */
  nota: 'Cada radicado puede verificarse en consultaprocesos.ramajudicial.gov.co, el buscador público de la Rama Judicial.',
  masCasos: '¿Necesita referencias de otros procesos?',
  masCasosCta: 'Escríbanos',
} as const;

/** Cómo se nombra cada tipo en pantalla, y qué significa. */
export const tiposCaso = {
  contradiccion: { etiqueta: 'Contradicción', ayuda: 'Desarmar el dictamen de la contraparte' },
  verificacion: { etiqueta: 'Verificación', ayuda: 'Comprobar si el perjuicio reclamado existe' },
  cuantificacion: { etiqueta: 'Cuantificación', ayuda: 'Calcular el daño' },
} as const;
