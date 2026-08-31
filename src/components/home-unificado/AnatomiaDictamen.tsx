'use client';

import { useState } from 'react';
import { anatomia } from '@/lib/content/home-unificado/metodologia';
import { Pendiente } from './Pendiente';

/**
 * Anatomía del dictamen, interactiva.
 *
 * Es la mezcla de dos patrones que salieron de la investigación: la lista de
 * partes del entregable y el "dictamen de muestra". Pero sin fabricar un
 * documento: el esquema de la derecha es un ESQUEMA, no un dictamen falso, así
 * que no promete un contenido técnico que ningún perito escribió.
 *
 * Al recorrer las partes —con el mouse, con Tab o con el teclado— se enciende la
 * zona correspondiente de la hoja. Responde "¿y qué me entregan exactamente?"
 * que es justo lo que el filtro de pestañas nunca contestó.
 */
export function AnatomiaDictamen() {
  const [activa, setActiva] = useState<string | null>(null);

  return (
    <div className="anat">
      <div className="anat__lista-col">
        <p className="mono anat__rotulo">Lo que trae adentro</p>
        <h3 className="anat__titulo">Anatomía de un dictamen</h3>
        <p className="anat__lead">
          Seis partes, siempre las mismas. Recórralas y vea dónde cae cada una.
        </p>

        <ol className="anat__lista">
          {anatomia.map((a) => (
            <li key={a.numero}>
              <button
                type="button"
                className="anat__boton"
                aria-pressed={activa === a.numero}
                onMouseEnter={() => setActiva(a.numero)}
                onMouseLeave={() => setActiva(null)}
                onFocus={() => setActiva(a.numero)}
                onBlur={() => setActiva(null)}
                onClick={() => setActiva(activa === a.numero ? null : a.numero)}
              >
                <span className="mono anat__num">{a.numero}</span>
                <span className="anat__texto">
                  <span className="anat__parte">{a.parte}</span>
                  <span className="anat__detalle">
                    {a.detalle}
                    {a.pendiente ? <> · <Pendiente>{a.pendiente}</Pendiente></> : null}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/*
        La hoja es decorativa: comunica la estructura, no el contenido. Por eso
        va con aria-hidden — para un lector de pantalla la lista de la izquierda
        ya dice todo lo que hay que saber, y repetirlo en trazos sería ruido.
      */}
      <div className={`hoja${activa ? ' hoja--enfocando' : ''}`} aria-hidden="true">
        <div className="hoja__papel">
          <div className="hoja__membrete">
            <span className="mono">DICTAMEN PERICIAL</span>
            <span className="mono hoja__folio">FOLIO 1 / 24</span>
          </div>

          <Zona id="01" activa={activa} titulo="Objeto del dictamen">
            <i className="ln ln--80" />
            <i className="ln ln--60" />
          </Zona>

          <Zona id="02" activa={activa} titulo="Metodología aplicada">
            <i className="ln ln--90" />
            <i className="ln ln--75" />
            <i className="ln ln--50" />
          </Zona>

          <Zona id="03" activa={activa} titulo="Documentos examinados">
            <div className="hoja__filas">
              <i className="fila" /><i className="fila" /><i className="fila" /><i className="fila" />
            </div>
          </Zona>

          <Zona id="04" activa={activa} titulo="Cálculos y anexos">
            <div className="hoja__barras">
              <i style={{ height: '38%' }} /><i style={{ height: '62%' }} /><i style={{ height: '48%' }} />
              <i style={{ height: '84%' }} /><i style={{ height: '70%' }} /><i style={{ height: '96%' }} />
            </div>
          </Zona>

          <Zona id="05" activa={activa} titulo="Conclusiones">
            <i className="ln ln--70" />
            <i className="ln ln--85 ln--fuerte" />
          </Zona>

          <Zona id="06" activa={activa} titulo="Firma y credenciales">
            <div className="hoja__firma">
              <span className="hoja__rubrica" />
              <span className="hoja__sello" />
            </div>
          </Zona>
        </div>
      </div>
    </div>
  );
}

function Zona({
  id,
  activa,
  titulo,
  children,
}: {
  id: string;
  activa: string | null;
  titulo: string;
  children: React.ReactNode;
}) {
  const encendida = activa === id;
  return (
    <div className={`zona${encendida ? ' zona--on' : ''}`}>
      <span className="mono zona__num">{id}</span>
      <span className="zona__titulo">{titulo}</span>
      <div className="zona__cuerpo">{children}</div>
    </div>
  );
}
