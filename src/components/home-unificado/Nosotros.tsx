import { ficha, nosotros, principios } from '@/lib/content/home-unificado/nosotros';
import { Pendiente } from './Pendiente';

/**
 * Quiénes somos.
 *
 * Va al final del recorrido a propósito: quien llega quiere resolver su caso,
 * no leer sobre nosotros. El PDF de rediseño lo dice con el ejemplo de Mazda —
 * primero el modelo y el precio, después quiénes son.
 *
 * ── La composición ──
 * Tres recursos, ninguno necesita una imagen:
 *
 * 1. ASIMETRÍA. El rótulo vive en una columna angosta a la izquierda y todo el
 *    contenido corre desplazado a la derecha. Es el recurso de Public Digital:
 *    la sección deja de leerse como bloque de relleno solo con eso.
 * 2. RÓTULO ADHERIDO. Esa columna izquierda se queda fija mientras los cinco
 *    principios pasan por debajo, como el "about" de Manual.
 * 3. RIEL NUMÉRICO. El número va en un canal de ancho fijo con cifras
 *    tabulares, y el cuerpo se indenta a ese mismo canal — el mecanismo del
 *    manifiesto de 37signals. Sin círculo, sin insignia, sin icono.
 *
 * ── Por qué no hay foto ──
 * La que había era de archivo: tres personas mirando gráficas. Al revisar el
 * sector salió que ni siquiera Exponent tiene fotos propias —usa stock de
 * aviones y plataformas petroleras— y que el stock solo sobrevive cuando el
 * texto es tan concreto que la imagen deja de importar. Aquí el texto hace ese
 * trabajo, así que la foto sobra. Si algún día hay retratos reales de los
 * peritos que firman, esos sí entran.
 */
export function Nosotros() {
  return (
    <section className="quienes" id="nosotros" aria-labelledby="quienes-titulo">
      <div className="wrap quienes__wrap">
        <div className="quienes__canal">
          <p className="mono quienes__eyebrow">{nosotros.eyebrow}</p>
        </div>

        <div className="quienes__cuerpo">
          <h2 className="quienes__titular" id="quienes-titulo">
            {nosotros.titular}
            <em> {nosotros.titularDestacado}</em>
          </h2>

          <p className="quienes__entrada">{nosotros.entrada}</p>

          <h3 className="mono quienes__rotulo">{nosotros.rotuloPrincipios}</h3>

          <ol className="principios">
            {principios.map((p, i) => (
              <li key={p.titulo}>
                <span className="principio__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="principio__texto">
                  <h4>{p.titulo}</h4>
                  <p>
                    {p.texto}
                    {p.pendiente && ' '}
                    {p.pendiente && <Pendiente>{p.pendiente}</Pendiente>}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="firma">
            <div className="firma__decir">
              <h3 className="mono quienes__rotulo">{ficha.rotulo}</h3>
              <p className="firma__descripcion">{ficha.descripcion}</p>
            </div>
            <dl className="firma__datos">
              {ficha.datos.map((d) => (
                <div key={d.etiqueta}>
                  <dt className="firma__valor">{d.valor}</dt>
                  <dd className="mono firma__etiqueta">{d.etiqueta}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
