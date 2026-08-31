'use client';

import { useState } from 'react';
import { contacto, datosContacto } from '@/lib/content/home-unificado/sitio';
import { MapaCobertura } from './MapaCobertura';

type Estado = 'idle' | 'loading' | 'success' | 'error';

/** Formulario final y panel de cobertura, conectados al flujo real de leads. */
export function Contacto() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState<Estado>('idle');

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado('loading');

    try {
      const respuesta = await fetch('/api/web-form', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre, email, telefono, mensaje, origen: 'landing' }),
      });
      if (!respuesta.ok) throw new Error('No se pudo enviar el formulario');

      setNombre('');
      setEmail('');
      setTelefono('');
      setMensaje('');
      setEstado('success');
    } catch {
      setEstado('error');
    }
  }

  return (
    <section className="contacto" id="contacto">
      <div className="wrap">
        <div>
          <div className="sec-head">
            <p className="eyebrow">{contacto.eyebrow}</p>
            <h2>{contacto.titulo}</h2>
            <p>{contacto.bajada}</p>
          </div>

          <form className="form" onSubmit={enviar}>
            <div className="field">
              <label htmlFor="nombre">Nombre *</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Nombre y apellido"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="correo">Correo electrónico *</label>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                autoComplete="email"
                placeholder="nombre@firma.com"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="telefono">Teléfono *</label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                required
                autoComplete="tel"
                pattern="^\+?(?:[0-9]|\s|\(|\)|-){7,20}$"
                title="Ingrese un número de teléfono válido"
                placeholder="300 000 0000"
                value={telefono}
                onChange={(evento) => setTelefono(evento.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mensaje">Mensaje *</label>
              <textarea
                id="mensaje"
                name="mensaje"
                required
                maxLength={2000}
                placeholder="Etapa procesal, qué se discute y para cuándo lo necesita."
                value={mensaje}
                onChange={(evento) => setMensaje(evento.target.value)}
              />
            </div>

            <div className="form-status" aria-live="polite">
              {estado === 'success' && (
                <p className="form-status--success">
                  <EstadoIcono exito />
                  Mensaje enviado. Nos pondremos en contacto pronto.
                </p>
              )}
              {estado === 'error' && (
                <p className="form-status--error" role="alert">
                  <EstadoIcono />
                  No pudimos enviar el mensaje. Revise los datos e inténtelo de nuevo.
                </p>
              )}
            </div>

            <div>
              <button className="btn btn-lg" type="submit" disabled={estado === 'loading'}>
                {estado === 'loading' ? 'Enviando…' : contacto.boton}
              </button>
            </div>
          </form>
        </div>

        <aside className="panel">
          <div className="panel__decir">
            <p className="mono panel__eyebrow">Dónde estamos</p>
            <h3 className="panel__titulo">
              Una sede.<em> El dictamen viaja al juzgado.</em>
            </h3>
            <p className="panel__texto">
              No tenemos una oficina en cada ciudad ni la necesitamos. El expediente y la
              audiencia mandan: el dictamen se rinde donde esté el proceso.
            </p>
          </div>

          <figure className="panel__mapa">
            <MapaCobertura />
            <figcaption className="mapa__pie">
              <span className="mapa__marca" aria-hidden="true" />
              Cali · única sede
            </figcaption>
          </figure>

          <dl className="panel__datos">
            {datosContacto.map((dato) => (
              <div key={dato.titulo}>
                <dt className="mono">{dato.titulo}</dt>
                <dd>
                  <span className="panel__valor">{dato.valor}</span>
                  {dato.nota && <small>{dato.nota}</small>}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

function EstadoIcono({ exito = false }: { exito?: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      {exito ? (
        <path d="m8 12 2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="2" />
      ) : (
        <path d="M12 7v6m0 4h.01" fill="none" stroke="currentColor" strokeWidth="2" />
      )}
    </svg>
  );
}
