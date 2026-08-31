import Image from 'next/image';
import Link from 'next/link';
import { contactoDirecto, hero, nav } from '@/lib/content/home-unificado/sitio';

/**
 * Encabezado.
 *
 * Un solo botón de conversión. Hoy el sitio publica 19 elementos de acción con
 * 9 etiquetas distintas —seis empiezan por "Solicitar" y todas van al mismo
 * formulario—, que es lo que esta versión elimina.
 *
 * El acceso del perito va al lado, discreto: hoy ese camino no existe en
 * cnp.com.co. Y no lleva a un login con Google, que se descartó el 20-ago
 * (formulario largo y riesgo de que el perito entre con otra cuenta y no
 * encuentre sus casos).
 *
 * El WhatsApp entra por una razón medida: en una auditoría de 20 sitios de la
 * competencia colombiana, **12 lo tienen a la vista y CNP no tenía ni eso ni un
 * enlace `tel:` en toda la home**. Un abogado con audiencia la semana entrante
 * no llena un formulario de tres pasos: escribe. El calificador sigue siendo la
 * puerta principal —da más contexto y filtra mejor—, pero dejar sin salida a
 * quien tiene prisa es regalar el caso.
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="Centro Nacional de Pruebas — inicio">
          <Image
            src="/images/cnp-blanco.png"
            alt="Centro Nacional de Pruebas"
            width={1232}
            height={343}
            priority
          />
        </Link>

        <nav className="site-nav" aria-label="Principal">
          {nav.map((enlace) => (
            <a key={enlace.texto} href={enlace.href}>
              {enlace.texto}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <a
            className="wa"
            href={`https://wa.me/${contactoDirecto.telefonoPlano}?text=${encodeURIComponent(contactoDirecto.mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconoWhatsapp />
            <span className="wa__numero">{contactoDirecto.telefono}</span>
            <span className="sr"> — escribir por {contactoDirecto.rotuloWhatsapp}, se abre en otra pestaña</span>
          </a>
          <a className="btn" href={hero.cta.href}>
            {hero.cta.texto}
          </a>
          <a className="link-perito" href={hero.ctaPerito.href}>
            ¿Eres perito?
          </a>
        </div>
      </div>
    </header>
  );
}

function IconoWhatsapp() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.23 8.23 0 0 1 0 16.47Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.31-.22.24-.85.83-.85 2.03s.88 2.35 1 2.51c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
