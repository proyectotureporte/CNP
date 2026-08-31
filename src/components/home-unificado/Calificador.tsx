'use client';

import { useId, useRef, useState } from 'react';
import { cierre, errorEnvio, etapas, materias, paso3 } from '@/lib/content/home-unificado/calificador';
import { IconoMateria } from './IconoMateria';

/**
 * Calificador del hero. Tres pasos y un cierre.
 *
 * Los dos primeros preguntan por el CASO —qué hay que dictaminar y en qué etapa
 * va— y el tercero por la PERSONA. Ese orden no es capricho: pedir el correo
 * antes de haber demostrado que se entiende el problema es lo que hace que la
 * gente cierre la pestaña.
 *
 * Decisiones que vienen de la auditoría de accesibilidad y conviene no deshacer:
 *
 * 1. Son RADIOS NATIVOS dentro de un `fieldset` con `legend`, ocultos
 *    visualmente, con la tarjeta como su `label`. Así llegan gratis el foco, las
 *    flechas, la agrupación y el envío. Volver a `div` + `onClick` deja el
 *    componente inoperable con teclado (WCAG 2.1.1) y mudo para un lector de
 *    pantalla (4.1.2).
 * 2. Cambiar de materia NO reinicia la etapa. Con teclado las flechas cambian
 *    la selección al navegar, así que recorrer las materias borraba la respuesta
 *    del paso 2 en silencio.
 * 3. El cambio de paso se anuncia por una región `aria-live` en vez de mover el
 *    foco (WCAG 4.1.3): mover el foco a mitad de navegación es peor.
 * 4. La selección no se indica solo con color (1.4.1): entra también un chulo.
 * 5. El fallo de envío va en `role="alert"`, no en la región `polite`: es lo
 *    único que interrumpe a propósito, porque el visitante cree que ya envió.
 *
 * El envío es real y puede fallar de verdad. La pantalla de confirmación SOLO
 * aparece si la API respondió que sí — una solicitud que nadie recibió jamás
 * puede decirle al visitante que la recibimos. El envío reutiliza el endpoint
 * público `/api/web-form`, que persiste el lead y dispara su confirmación.
 */

type Envio = 'quieto' | 'enviando' | 'fallo';

/** El indicativo de Colombia, para que el enlace marque desde cualquier parte. */
function aTelefono(numero: string) {
  return 'tel:+57' + numero.replace(/\s/g, '');
}

export function Calificador() {
  const [materia, setMateria] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<string | null>(null);
  const [enDatos, setEnDatos] = useState(false);
  const [envio, setEnvio] = useState<Envio>('quieto');
  const [enviada, setEnviada] = useState(false);
  const fecha = useRef<HTMLInputElement>(null);
  const idBase = useId();

  const mat = materias.find((m) => m.id === materia) ?? null;
  const eta = etapas.find((e) => e.id === etapa) ?? null;

  const rotulo = enviada ? 'Enviada' : !mat ? 'Paso 1 / 3' : !eta ? 'Paso 2 / 3' : 'Paso 3 / 3';

  const anuncio = enviada
    ? 'Solicitud enviada.'
    : enDatos
      ? 'Paso 3 de 3: sus datos de contacto.'
      : mat && eta
        ? 'Listo. Revise el resumen y continúe.'
        : mat
          ? 'Paso 2 de 3: ¿En qué etapa va el proceso?'
          : '';

  async function enviar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!mat || !eta) return;

    const datos = new FormData(ev.currentTarget);
    setEnvio('enviando');

    try {
      const detalle = String(datos.get('detalle') ?? '').trim();
      const fechaAudiencia = fecha.current?.value;
      const mensaje = [
        `Materia: ${mat.titulo}`,
        `Etapa: ${eta.titulo}`,
        fechaAudiencia ? `Fecha de audiencia: ${fechaAudiencia}` : null,
        detalle ? `Detalle: ${detalle}` : null,
      ].filter(Boolean).join('\n');

      const r = await fetch('/api/web-form', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nombre: String(datos.get('nombre') ?? ''),
          email: String(datos.get('correo') ?? ''),
          telefono: String(datos.get('telefono') ?? ''),
          mensaje,
          origen: 'landing',
        }),
      });
      if (!r.ok) throw new Error('la API respondió ' + r.status);
      setEnviada(true);
      setEnvio('quieto');
    } catch {
      setEnvio('fallo');
    }
  }

  // ── el cierre ──
  if (enviada && mat && eta) {
    return (
      <div className="calificador calificador--cierre">
        <div className="calificador__filo" />
        <span className="calificador__marca calificador__marca--ti" />
        <span className="calificador__marca calificador__marca--bi" />
        <p className="sr" aria-live="polite">{anuncio}</p>

        <div className="calificador__cuerpo">
          <div className="calificador__encabezado">
            <span className="mono etiqueta-tenue">Solicitud de dictamen</span>
            <span className="mono etiqueta-paso">{rotulo}</span>
          </div>

          <div className="sello" aria-hidden="true"><Chulo /></div>
          <h3 className="sello__titulo">{cierre.titulo}</h3>
          <p className="sello__texto">{cierre.texto}</p>

          <div className="calificador__sep calificador__sep--oro" />
          <p className="mono etiqueta-tenue">{cierre.rotuloResumen}</p>
          <p className="calificador__resumen">Dictamen {mat.frase}, {eta.frase}.</p>

          {/* Qué sigue, en tres pasos. Un cierre que solo dice "gracias" deja al
              visitante sin saber si tiene que hacer algo más — y volviendo a
              enviar el formulario, que es de donde salen los leads duplicados. */}
          <ol className="sello__pasos">
            {cierre.pasos.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>

          <p className="sello__urgente">
            <b>{cierre.unaVez}</b> {cierre.urgente}{' '}
            <a href={aTelefono(cierre.telefono)}>{cierre.telefono}</a>.
          </p>

        </div>
      </div>
    );
  }

  return (
    <form className="calificador" onSubmit={enviar}>
      <div className="calificador__filo" />
      <span className="calificador__marca calificador__marca--ti" />
      <span className="calificador__marca calificador__marca--bi" />

      <p className="sr" aria-live="polite">{anuncio}</p>

      <div className="calificador__cuerpo">
        <div className="calificador__encabezado">
          <span className="mono etiqueta-tenue">Solicitud de dictamen</span>
          <span className="mono etiqueta-paso">{rotulo}</span>
        </div>

        {!mat && (
          <fieldset>
            <legend className="calificador__pregunta">
              <span className="mono calificador__num">01</span>
              <span>¿Qué necesita dictaminar?</span>
            </legend>
            <div className="opciones opciones--rejilla">
              {materias.map((m) => (
                <div className={m.id === 'otr' ? 'op op--ancha' : 'op'} key={m.id}>
                  <input
                    type="radio"
                    name="materia"
                    id={idBase + '-' + m.id}
                    checked={materia === m.id}
                    onChange={() => setMateria(m.id)}
                  />
                  <label htmlFor={idBase + '-' + m.id}>
                    <span className="op__ico"><IconoMateria nombre={m.icono} /></span>
                    {m.etiqueta}
                    <span className="op__tick"><Chulo /></span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {mat && (
          <div className="resuelto">
            <span className="mono calificador__num">01</span>
            <span>{mat.titulo}</span>
            <button
              type="button"
              className="mono cambiar"
              onClick={() => { setMateria(null); setEnDatos(false); }}
            >
              Cambiar<span className="sr"> materia: {mat.titulo}</span>
            </button>
          </div>
        )}

        {/*
          El separador va FUERA del fieldset. Dentro, el navegador pinta el
          `legend` en la cabecera del fieldset pase lo que pase, así que un div
          escrito antes del legend termina saliendo después y abre un hueco.
        */}
        {mat && !eta && <div className="calificador__sep" />}

        {mat && !eta && (
          <fieldset>
            <legend className="calificador__pregunta">
              <span className="mono calificador__num">02</span>
              <span>¿En qué etapa va el proceso?</span>
            </legend>
            <div className="opciones">
              {etapas.map((e) => (
                <div className="op" key={e.id}>
                  <input
                    type="radio"
                    name="etapa"
                    id={idBase + '-' + e.id}
                    checked={etapa === e.id}
                    onChange={() => setEtapa(e.id)}
                  />
                  <label htmlFor={idBase + '-' + e.id}>
                    <span className="op__punto" />
                    {e.etiqueta}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {mat && eta && (
          <div className="resuelto resuelto--segundo">
            <span className="mono calificador__num">02</span>
            <span>{eta.titulo}</span>
            <button
              type="button"
              className="mono cambiar"
              onClick={() => { setEtapa(null); setEnDatos(false); }}
            >
              Cambiar<span className="sr"> etapa: {eta.titulo}</span>
            </button>
          </div>
        )}

        {/*
          La fecha de audiencia se pide en el paso 2 pero tiene que sobrevivir al
          paso 3: por eso en el paso 3 se OCULTA en vez de desmontarse.
          Desmontarla borraría lo que el visitante ya escribió.
        */}
        {mat && eta && eta.pideFecha && (
          <div className={enDatos ? 'fecha-fila fecha-fila--guardada' : 'fecha-fila'}>
            <label htmlFor={idBase + '-fecha'}>
              Fecha de la audiencia <span className="tenue">(opcional)</span>
            </label>
            <input className="fecha" type="date" id={idBase + '-fecha'} name="fechaAudiencia" ref={fecha} />
          </div>
        )}

        {mat && eta && !enDatos && (
          <div>
            <div className="calificador__sep calificador__sep--oro" />
            <p className="mono etiqueta-tenue">Lo que vamos a revisar</p>
            <p className="calificador__resumen">Dictamen {mat.frase}, {eta.frase}.</p>
            <div className="calificador__cierre">
              <button type="button" className="btn-oro" onClick={() => setEnDatos(true)}>
                Continuar
              </button>
              <span className="calificador__nota">{eta.nota}</span>
            </div>
          </div>
        )}

        {mat && eta && enDatos && <div className="calificador__sep calificador__sep--oro" />}

        {mat && eta && enDatos && (
          <fieldset className="datos-contacto">
            <legend className="calificador__pregunta">
              <span className="mono calificador__num">03</span>
              <span>{paso3.titulo}</span>
            </legend>

            <div className="campos">
              <div className="campo">
                <label htmlFor={idBase + '-nombre'}>{paso3.campos.nombre.etiqueta}</label>
                <input
                  id={idBase + '-nombre'}
                  name="nombre"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete={paso3.campos.nombre.autoComplete}
                />
              </div>

              <div className="campo campo--par">
                <div>
                  <label htmlFor={idBase + '-correo'}>{paso3.campos.correo.etiqueta}</label>
                  <input
                    id={idBase + '-correo'}
                    name="correo"
                    type="email"
                    required
                    autoComplete={paso3.campos.correo.autoComplete}
                  />
                </div>
                <div>
                  <label htmlFor={idBase + '-telefono'}>{paso3.campos.telefono.etiqueta}</label>
                  <input
                    id={idBase + '-telefono'}
                    name="telefono"
                    type="tel"
                    required
                    pattern="^\+?(?:[0-9]|\s|\(|\)|-){7,20}$"
                    title="Ingrese un número de teléfono válido"
                    autoComplete={paso3.campos.telefono.autoComplete}
                  />
                </div>
              </div>

              <div className="campo">
                <label htmlFor={idBase + '-detalle'}>
                  {paso3.campos.detalle.etiqueta} <span className="tenue">(opcional)</span>
                </label>
                <textarea id={idBase + '-detalle'} name="detalle" rows={2} maxLength={1800} />
              </div>

              <p className="porque">{paso3.porQue}</p>

              <div className="permiso">
                <input id={idBase + '-ok'} name="autorizacion" type="checkbox" required />
                <label htmlFor={idBase + '-ok'}>
                  {paso3.autorizacion}{' '}
                  <a href={paso3.autorizacionEnlace.href}>{paso3.autorizacionEnlace.texto}</a>
                </label>
              </div>
            </div>

            {envio === 'fallo' && (
              <div className="fallo" role="alert">
                <b>{errorEnvio.titulo}</b>
                <span>
                  {errorEnvio.texto}{' '}
                  <a href={'mailto:' + errorEnvio.correo}>{errorEnvio.correo}</a>
                  {' · '}
                  <a href={aTelefono(errorEnvio.telefono)}>{errorEnvio.telefono}</a>
                </span>
              </div>
            )}

            <div className="calificador__cierre">
              <button type="submit" className="btn-oro" disabled={envio === 'enviando'}>
                {envio === 'enviando'
                  ? paso3.enviando
                  : envio === 'fallo'
                    ? errorEnvio.reintentar
                    : paso3.boton}
              </button>
              <button type="button" className="mono cambiar" onClick={() => setEnDatos(false)}>
                Volver
              </button>
            </div>
          </fieldset>
        )}
      </div>
    </form>
  );
}

function Chulo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}
