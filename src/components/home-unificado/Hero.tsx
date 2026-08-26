import Link from 'next/link';
import { hero } from '@/lib/content/home-unificado/sitio';
import { HeroMedia } from './HeroMedia';

/**
 * Apertura.
 *
 * Un titular que dice literalmente qué hacemos y para quién, legible en diez
 * segundos, y un solo botón. La medición de Nielsen Norman Group que sostiene
 * esto está en el PDF "Rediseño de cnp.com.co", sección 2: la visita dura menos
 * de un minuto, se lee cerca del 20% del texto y el 80% de la atención está
 * arriba del pliegue.
 *
 * OJO — el titular de `content/sitio.ts` es un marcador. El definitivo sale de
 * las tres conversaciones con clientes y perito.
 */
export function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-texto">
          <p className="eyebrow">{hero.eyebrow}</p>

          <h1>
            {hero.titular} <em>{hero.titularDestacado}</em>.
          </h1>

          <p className="lead">{hero.bajada}</p>

          <div className="hero-cta">
            <Link className="btn btn-lg" href={hero.cta.href}>
              {hero.cta.texto}
            </Link>
            <Link className="link-perito" href={hero.ctaPerito.href}>
              {hero.ctaPerito.texto} →
            </Link>
          </div>

        </div>

        <HeroMedia />

        {/* Cierra el hero de lado a lado: en una sola columna se rompía en tres renglones. */}
        <div className="hero-meta">
          {hero.datos.map((dato) => (
            <span key={dato.destacado}>
              <strong>{dato.destacado}</strong> {dato.texto}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
