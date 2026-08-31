import Image from 'next/image';
import { perfiles } from '@/lib/content/home-unificado/perfiles';
import { Pendiente } from './Pendiente';

/**
 * "A quién le servimos" — los cuatro trabajos que llegan, como pila de fichas.
 *
 * Esta sección ya pasó por dos formas antes de esta:
 *
 *   1 · Filtro de siete pestañas. Escondía tres cuartas partes del contenido
 *       detrás de un clic y exigía que el visitante se clasificara antes de ver
 *       nada — le preguntaba lo mismo que el calificador del hero le acababa de
 *       preguntar.
 *   2 · Las cuatro fichas desplegadas una debajo de otra. Se veía todo, pero
 *       eran cuatro pantallas seguidas: la sección más larga del sitio para
 *       decir cuatro cosas del mismo tamaño.
 *
 * Esta es la tercera. Cada trabajo es una ficha que se queda FIJA al llegar
 * arriba mientras la siguiente sube y se le monta encima, con un escalón de
 * 14 px que deja ver el filo de las anteriores. No es un carrusel: no hay
 * flechas, no hay puntos que pulsar, no hay nada oculto y no hay estado — es el
 * mismo scroll de la página el que pasa las fichas. Quien baja de corrido las
 * ve todas; quien se detiene lee una a la vez, encuadrada.
 *
 * La ganancia de alto no viene del apilado sino de la ficha: pasó de dos
 * columnas anchas a tres angostas, la foto dejó de ser un recuadro de 208 px
 * para ser una franja vertical en el canto —que no cuesta alto ninguno— y las
 * preguntas frecuentes subieron a columna en vez de colgar al final. De unos
 * 3.800 px a unos 2.000, sin sacar una sola palabra.
 *
 * Los perfiles que no son cliente tienen su propio sitio: el proceso quedó en
 * "Cómo se sostiene", el perito en la red PERITUS y el "quiénes somos" al final.
 */
const CLIENTES = ['abogado', 'firma', 'empresa', 'juez'];

export function Trabajos() {
  const trabajos = perfiles.filter((p) => CLIENTES.includes(p.id));

  return (
    <section className="trabajos" id="trabajos">
      <div className="wrap">
        <div className="trabajos__head">
          <p className="mono trabajos__eyebrow">A quién le servimos</p>
          <h2>Dos abogados con el mismo título llegan con trabajos distintos.</h2>
          <p className="trabajos__lead">
            Por eso no preguntamos quién es usted, sino qué vino a resolver. Estos son los cuatro
            trabajos que llegan, dichos como los dice quien llama.
          </p>
        </div>

        <div className="pila">
          {trabajos.map((p, i) => (
            <article className="ficha" key={p.id} style={{ '--i': i } as React.CSSProperties}>
              {/* La foto va como franja en el canto: sigue estando, da identidad
                  a cada ficha y no cuesta un solo píxel de alto. */}
              <div className="ficha__canto">
                <Image
                  src={p.imagen.src}
                  alt={p.imagen.alt}
                  width={p.imagen.ancho}
                  height={p.imagen.alto}
                  style={p.imagen.posicion ? { objectPosition: p.imagen.posicion } : undefined}
                />
              </div>

              <div className="ficha__cuerpo">
                <div className="ficha__barra">
                  <span className="mono ficha__folio">
                    {String(i + 1).padStart(2, '0')}
                    <span className="ficha__de"> / {String(trabajos.length).padStart(2, '0')}</span>
                  </span>
                  <span className="mono ficha__quien">{p.pestana}</span>
                  <span className="ficha__pastillas" aria-hidden="true">
                    {trabajos.map((otro, j) => (
                      <i className={j === i ? 'on' : undefined} key={otro.id} />
                    ))}
                  </span>
                </div>

                <blockquote className="ficha__cita">
                  <p>{p.enunciado.texto}</p>
                </blockquote>

                <div className="ficha__cols">
                  <div className="ficha__col">
                    <h3 className="mono ficha__rotulo">Lo que hacemos</h3>
                    <ul className="ficha__servicios">
                      {p.cuerpo.clase === 'servicios' &&
                        p.cuerpo.servicios.map((s) => (
                          <li key={s.titulo}>
                            <b>{s.titulo}</b>
                            <span>{s.descripcion}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="ficha__col">
                    <h3 className="mono ficha__rotulo">{p.lateral.titulo}</h3>
                    <ul className="ficha__recibe">
                      {p.lateral.items.map((item) => (
                        <li key={item.texto}>
                          {item.destacado && <b>{item.destacado} </b>}
                          {item.texto}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {p.faqs && (
                    <div className="ficha__col">
                      <h3 className="mono ficha__rotulo">Lo que siempre preguntan</h3>
                      <dl className="ficha__faq">
                        {p.faqs.map((f) => (
                          <div key={f.pregunta}>
                            <dt>{f.pregunta}</dt>
                            <dd>
                              {f.respuesta}
                              {f.respuesta && f.pendiente ? ' ' : null}
                              {f.pendiente && <Pendiente>{f.pendiente}</Pendiente>}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
