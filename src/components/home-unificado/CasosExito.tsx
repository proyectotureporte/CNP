'use client';

import { useMemo, useState } from 'react';
import { casos, casosHead, tiposCaso } from '@/lib/content/home-unificado/casos';
import type { TipoCaso } from '@/lib/content/home-unificado/types';

/**
 * Los casos, como registro de expediente.
 *
 * ── La tercera forma que toma esta sección ──
 * Ya pasó por dos: acordeón plegado (se veía plano, como si hubiera menos
 * casos de los que hay) y tarjetas siempre abiertas en grid (se veía rico,
 * pero nueve tarjetas con tanto aire pesaban casi 2.700 px — demasiado para
 * lo que es, en el fondo, prueba que se escanea, no un relato que se lee).
 *
 * Esta va por lo que estos datos SON: un registro. Una fila por caso, densa,
 * con la forma de una tabla de radicados — el mismo objeto que cualquier
 * abogado ya reconoce de su propio sistema de gestión de procesos. Nueve
 * filas de ~90 px caben en una fracción de lo que ocupaban las tarjetas, sin
 * esconder ni el juzgado ni el radicado ni el objeto: todo sigue a la vista,
 * solo que en una línea en vez de en un bloque con párrafo.
 *
 * ── Qué se sacrifica y qué no ──
 * El objeto se trunca a dos líneas (`line-clamp`) en vez de mostrarse
 * completo — es la única concesión real. El radicado, el despacho, las
 * partes y el tipo siguen enteros y visibles sin un solo clic.
 *
 * ── El destacado ya no es una tarjeta aparte ──
 * El caso con resultado (Falabella) sigue yendo primero, pero como una fila
 * más —con un filete dorado a la izquierda y un badge "Resultado" en línea—
 * en vez de una tarjeta separada que duplicaba el peso visual de la sección.
 */
export function CasosExito() {
  const [filtro, setFiltro] = useState<TipoCaso | 'todos'>('todos');

  const contradicciones = casos.filter((c) => c.tipo === 'contradiccion').length;

  const conteos = useMemo(() => {
    const c: Record<TipoCaso, number> = { contradiccion: 0, verificacion: 0, cuantificacion: 0 };
    for (const caso of casos) c[caso.tipo]++;
    return c;
  }, []);

  const visibles = casos.filter((c) => filtro === 'todos' || c.tipo === filtro);

  return (
    <section className="casos" id="casos" aria-labelledby="casos-titulo">
      <div className="wrap">
        <div className="casos__head">
          <p className="mono casos__eyebrow">{casosHead.eyebrow}</p>
          <h2 id="casos-titulo">{casosHead.titulo}</h2>
          <p className="casos__bajada">
            {casosHead.bajada.replace('{n}', String(contradicciones))}
          </p>
        </div>

        <div className="casos__filtros" role="group" aria-label="Filtrar casos por tipo de encargo">
          <button
            type="button"
            className={filtro === 'todos' ? 'chip-tipo chip-tipo--activo' : 'chip-tipo'}
            aria-pressed={filtro === 'todos'}
            onClick={() => setFiltro('todos')}
          >
            Todos <span className="chip-tipo__num">{casos.length}</span>
          </button>
          {(Object.keys(tiposCaso) as TipoCaso[]).map((t) => (
            <button
              key={t}
              type="button"
              className={filtro === t ? `chip-tipo chip-tipo--activo chip-tipo--${t}` : `chip-tipo chip-tipo--${t}`}
              aria-pressed={filtro === t}
              onClick={() => setFiltro(t)}
            >
              {tiposCaso[t].etiqueta} <span className="chip-tipo__num">{conteos[t]}</span>
            </button>
          ))}
        </div>

        <p className="sr" aria-live="polite">
          Mostrando {visibles.length} de {casos.length} casos.
        </p>

        {/*
          "fila-caso", no "fila": la sección de Anatomía de un dictamen ya
          usa ".fila" para los renglones fingidos del esquema (hoja__filas
          .fila). Es el mismo tipo de bug que rompió el bloque de PERITUS con
          el círculo -dos componentes distintos con el mismo nombre de clase,
          compartiendo reglas que no tienen nada que ver entre sí.
        */}
        <ul className="registro">
          {visibles.map((caso) => (
            <li className={`fila-caso fila-caso--${caso.tipo}`} key={caso.folio}>
              <span className="mono fila-caso__tipo">{tiposCaso[caso.tipo].etiqueta}</span>

              <div className="fila-caso__cuerpo">
                <div className="fila-caso__partesFila">
                  <p className="fila-caso__partes">{caso.partes}</p>
                  {/* Fuera del párrafo con line-clamp a propósito: un nombre de
                      partes largo (el de CNP-13) llena las dos líneas del
                      clamp y se comía la insignia si vivía adentro — un
                      badge que desaparece según cuánto mida el texto no
                      sirve de nada. Como hermano flex, siempre se ve. */}
                  {caso.insignia && <span className="fila-caso__insignia">{caso.insignia}</span>}
                </div>
                <p className="fila-caso__linea2">
                  {caso.despacho && <span className="fila-caso__despacho">{caso.despacho}</span>}
                  <span className="fila-caso__objeto">{caso.objeto}</span>
                </p>
                {caso.resultado && (
                  <p className="fila-caso__resultado">
                    <span className="mono fila-caso__resultado-rotulo">Resultado</span>
                    {caso.resultado}
                  </p>
                )}
                {caso.instancia && <p className="fila-caso__instancia">{caso.instancia}</p>}
              </div>

              {caso.radicado ? (
                <div className="fila-caso__radicadoCol">
                  <Radicado valor={caso.radicado} />
                  {/* El radicado de un recurso posterior necesita esta
                      aclaración al lado: sin ella, alguien podría buscarlo
                      esperando encontrar el proceso descrito y no el que
                      efectivamente hay detrás de ese número. */}
                  {caso.radicadoNota && <p className="fila-caso__radicadoNota">{caso.radicadoNota}</p>}
                </div>
              ) : (
                <span className="fila-caso__sinradicado">Sin radicado verificable</span>
              )}
            </li>
          ))}
        </ul>

        <div className="casos__pie">
          <p className="casos__nota">{casosHead.nota}</p>
          <a className="casos__cta" href="#contacto">
            {casosHead.masCasos} <span className="casos__cta-enlace">{casosHead.masCasosCta} →</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * El radicado, compacto, con botón de copiar.
 *
 * `navigator.clipboard` puede no existir (contexto no seguro, navegador viejo)
 * o puede rechazar el permiso: por eso el intento va en try/catch y, si falla,
 * el radicado se queda seleccionable de todas formas — el texto sigue ahí.
 */
function Radicado({ valor }: { valor: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso o sin API: el radicado sigue visible y seleccionable.
    }
  }

  return (
    <div className="radicado">
      <span className="mono radicado__rotulo">Radicado</span>
      <span className="mono radicado__num">{valor}</span>
      <button type="button" className="radicado__copiar" onClick={copiar}>
        {copiado ? 'Copiado' : 'Copiar'}
        <span className="sr"> radicado {valor}</span>
      </button>
    </div>
  );
}
