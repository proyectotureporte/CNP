'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { perfiles } from '@/lib/content/home-unificado/perfiles';
import type { CuerpoPerfil, LateralPerfil, Perfil } from '@/lib/content/home-unificado/types';

/**
 * Filtro por perfil.
 *
 * Reemplaza el selector "Soy abogado / soy empresa / soy juez". Esas son
 * categorías: dicen quién es el visitante, no qué vino a resolver. Dos abogados
 * con el mismo título llegan con trabajos distintos, y es el trabajo el que los
 * distingue. Por eso cada pestaña abre enunciando el trabajo en primera persona.
 *
 * Carga sin cambiar de página: el visitante no pierde el hilo ni vuelve a pagar
 * el costo de orientarse.
 */
export function FiltroPerfil() {
  const [activo, setActivo] = useState<string>(perfiles[0]!.id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Permite que "¿Eres perito?" del encabezado y del hero abran directamente
  // la pestaña correspondiente: /#perito, /#empresa, etc.
  const sincronizarConHash = useCallback((desplazar: boolean) => {
    const hash = window.location.hash.replace('#', '');
    if (!perfiles.some((perfil) => perfil.id === hash)) return;
    setActivo(hash);
    // El navegador no desplaza solo: ningún elemento tiene ese id, la pestaña
    // sí. Sin esto, "¿Eres perito?" cambia la pestaña y deja al visitante arriba.
    if (desplazar) {
      document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => sincronizarConHash(false));
    const alCambiarHash = () => sincronizarConHash(true);
    const alPulsarAncla = (evento: MouseEvent) => {
      const enlace = (evento.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = enlace?.getAttribute('href')?.slice(1);
      if (!hash || !perfiles.some((perfil) => perfil.id === hash)) return;

      setActivo(hash);
      window.requestAnimationFrame(() => {
        document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    window.addEventListener('hashchange', alCambiarHash);
    document.addEventListener('click', alPulsarAncla);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', alCambiarHash);
      document.removeEventListener('click', alPulsarAncla);
    };
  }, [sincronizarConHash]);

  function moverFoco(indiceActual: number, direccion: 1 | -1) {
    const siguiente = perfiles[(indiceActual + direccion + perfiles.length) % perfiles.length]!;
    setActivo(siguiente.id);
    refs.current[siguiente.id]?.focus();
  }

  return (
    <section className="filtro" id="servicios">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow">Qué necesita resolver</p>
          <h2>Elija su situación y vea exactamente qué entregamos.</h2>
          <p>
            Siete caminos, un solo formulario al final. No hay que leer el sitio entero para saber
            si somos lo que usted necesita.
          </p>
        </div>

        <div className="tabs" role="tablist" aria-label="Filtro por tipo de cliente">
          {perfiles.map((perfil, indice) => (
            <button
              key={perfil.id}
              id={`tab-${perfil.id}`}
              ref={(nodo) => {
                refs.current[perfil.id] = nodo;
              }}
              className="tab"
              type="button"
              role="tab"
              aria-selected={perfil.id === activo}
              aria-controls={`panel-${perfil.id}`}
              tabIndex={perfil.id === activo ? 0 : -1}
              onClick={() => setActivo(perfil.id)}
              onKeyDown={(evento) => {
                if (evento.key === 'ArrowRight') {
                  evento.preventDefault();
                  moverFoco(indice, 1);
                } else if (evento.key === 'ArrowLeft') {
                  evento.preventDefault();
                  moverFoco(indice, -1);
                }
              }}
            >
              {perfil.pestana}
            </button>
          ))}
        </div>

        {perfiles.map((perfil) => (
          <PanelPerfil key={perfil.id} perfil={perfil} visible={perfil.id === activo} />
        ))}
      </div>
    </section>
  );
}

function PanelPerfil({ perfil, visible }: { perfil: Perfil; visible: boolean }) {
  return (
    <div
      className="panel"
      id={`panel-${perfil.id}`}
      role="tabpanel"
      aria-labelledby={`tab-${perfil.id}`}
      hidden={!visible}
    >
      <div>
        <div className="job">
          <p className="eyebrow">{perfil.enunciado.eyebrow}</p>
          <q>{perfil.enunciado.texto}</q>
        </div>
        <Cuerpo cuerpo={perfil.cuerpo} />
      </div>

      <div className="aside">
        <div className="panel-foto">
          <Image
            src={perfil.imagen.src}
            alt={perfil.imagen.alt}
            width={perfil.imagen.ancho}
            height={perfil.imagen.alto}
            style={perfil.imagen.posicion ? { objectPosition: perfil.imagen.posicion } : undefined}
          />
        </div>

        <Lateral lateral={perfil.lateral} />

        {perfil.faqs?.some((faq) => faq.respuesta) && (
          <dl className="faq">
            {perfil.faqs.filter((faq) => faq.respuesta).map((faq) => (
              <div key={faq.pregunta}>
                <dt>{faq.pregunta}</dt>
                <dd>{faq.respuesta}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

function Cuerpo({ cuerpo }: { cuerpo: CuerpoPerfil }) {
  switch (cuerpo.clase) {
    case 'servicios':
      return (
        <ul className="svc">
          {cuerpo.servicios.map((servicio) => (
            <li key={servicio.titulo}>
              <h4>{servicio.titulo}</h4>
              <p>{servicio.descripcion}</p>
            </li>
          ))}
        </ul>
      );

    case 'pasos':
      return (
        <ol className="pasos">
          {cuerpo.pasos.map((paso) => (
            <li key={paso.titulo}>
              <h4>{paso.titulo}</h4>
              <p>{paso.descripcion}</p>
            </li>
          ))}
        </ol>
      );

    case 'texto':
      return (
        <>
          {cuerpo.parrafos.map((parrafo) => (
            <p key={parrafo.slice(0, 40)} className="parrafo">
              {parrafo}
            </p>
          ))}
        </>
      );
  }
}

function Lateral({ lateral }: { lateral: LateralPerfil }) {
  return (
    <>
      <h4>{lateral.titulo}</h4>
      <ul className="recibe">
        {lateral.items.map((item) => (
          <li key={item.texto}>
            {item.destacado && <b>{item.destacado} </b>}
            {item.texto}
          </li>
        ))}
      </ul>
      {lateral.nota && <p className="nota">{lateral.nota}</p>}
      {lateral.cta && (
        <Link className="btn" href={lateral.cta.href}>
          {lateral.cta.texto}
        </Link>
      )}
    </>
  );
}
