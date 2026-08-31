import { AnatomiaDictamen } from './AnatomiaDictamen';
import { pilares, proceso } from '@/lib/content/home-unificado/metodologia';

/**
 * "Cómo se sostiene" — la sección que va justo debajo del hero.
 *
 * Reemplaza al filtro de siete pestañas, que le preguntaba al visitante lo
 * mismo que el calificador del hero acababa de preguntarle. Aquí no se pregunta
 * nada: se responde la objeción que de verdad decide la compra, que es si el
 * dictamen va a resistir la contradicción.
 *
 * Tres capas, de lo general a lo concreto:
 *   1. Cuatro pilares — por qué aguanta.
 *   2. Anatomía del dictamen, interactiva — qué trae adentro y dónde cae.
 *   3. El proceso en cinco pasos — cómo se llega hasta ahí.
 */
export function Metodologia() {
  return (
    <section className="metodo" id="servicios">
      <div className="wrap">
        <div className="metodo__head">
          <p className="mono metodo__eyebrow">Cómo se sostiene</p>
          <h2>Un dictamen se defiende por cómo está hecho, no por quién lo firma.</h2>
          <p className="metodo__lead">
            La contraparte no va a discutir nuestras conclusiones: va a discutir de dónde salieron.
            Por eso el método, el alcance y la trazabilidad se declaran desde el principio.
          </p>
        </div>

        <ol className="pilares">
          {pilares.map((p) => (
            <li key={p.numero}>
              <span className="mono pilares__num">{p.numero}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>

        <AnatomiaDictamen />

        <div className="proceso">
          <p className="mono proceso__rotulo">De la solicitud a la audiencia</p>
          <ol className="proceso__pasos">
            {proceso.map((p, i) => (
              <li key={p.titulo}>
                <span className="mono proceso__num">{String(i + 1).padStart(2, '0')}</span>
                <h4>{p.titulo}</h4>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
