'use client';

import { useState } from 'react';
import { contacto, datosContacto } from '@/lib/content/home-unificado/sitio';

/**
 * Contacto.
 *
 * Un solo formulario y un solo destino. El teléfono y el correo de PERITUS se
 * desvían aquí: nadie que llame al número viejo debe quedarse sin respuesta.
 *
 * Conserva el endpoint público de leads que ya usa CNP, por lo que la nueva
 * interfaz mantiene la persistencia en PostgreSQL y el correo de confirmación.
 */
export function Contacto() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado('loading');

    try {
      const respuesta = await fetch('/api/web-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="m8 12 2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Mensaje enviado. Nos pondremos en contacto pronto.
                </p>
              )}
              {estado === 'error' && (
                <p className="form-status--error">
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 7v6m0 4h.01" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
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

        <div className="datos">
          {datosContacto.map((dato) => (
            <div key={dato.titulo}>
              <h4>{dato.titulo}</h4>
              <p>
                {dato.valor}
                {dato.nota && <small>{dato.nota}</small>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
