import { Calificador } from './Calificador';
import { compromisos } from '@/lib/content/home-unificado/calificador';
import { hero } from '@/lib/content/home-unificado/sitio';

/**
 * Apertura.
 *
 * Estructura: mensaje a la izquierda, calificador a la derecha sangrando al
 * borde, y una franja de prueba al pie. El fondo es una foto de archivo bajo un
 * velo azul que se abre hacia la derecha — el recurso que usan las firmas
 * periciales grandes (CRA tapa su video con navy al 70%).
 *
 * Al pie van las tres cifras y nada más. Los logos de clientes salieron de aquí
 * a sección propia: apretados en un riel de 20 px al final de la apertura,
 * pesaban menos que el argumento que sostienen.
 *
 * El titular de `content/sitio.ts` sigue siendo un marcador: el definitivo sale
 * de las tres conversaciones con clientes y perito.
 */
export function Hero() {
  return (
    <section className="hero">
      <div className="hero__fondo" />
      <div className="hero__velo" />
      <div className="hero__luz" />
      <div className="hero__grano" />
      <div className="hero__vineta" />

      <div className="hero__rejilla">
        <div className="hero__texto">
          <div className="hero__filo" />
          <p className="mono hero__eyebrow">{hero.eyebrow}</p>

          <h1 className="hero__titular">
            <span className="renglon"><span className="rn r1">Empecemos por</span></span>
            <span className="renglon"><span className="rn r2 oro">su caso,</span></span>
            <span className="renglon"><span className="rn r3">no por nosotros.</span></span>
          </h1>

          <p className="hero__bajada">{hero.bajada}</p>

          <ul className="compromisos">
            {compromisos.map((texto, i) => (
              <li key={texto}>
                <span className="mono compromisos__num">{String(i + 1).padStart(2, '0')}</span>
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <Calificador />
      </div>

      <div className="hero__pie">
        <div className="hero__pie-filo" />
        <div className="hero__pie-fila">
          {hero.datos.map((dato) => (
            <div className="cifra" key={dato.destacado}>
              <span className="cifra__valor">{dato.destacado}</span>
              <span className="mono cifra__rotulo">{dato.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
