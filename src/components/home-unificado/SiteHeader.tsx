import Image from 'next/image';
import Link from 'next/link';
import { hero, nav } from '@/lib/content/home-unificado/sitio';

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
