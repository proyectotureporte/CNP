import Image from 'next/image';
import { admision, disciplinas, redPeritus } from '@/lib/content/home-unificado/disciplinas';
import { perfiles } from '@/lib/content/home-unificado/perfiles';
import { IconoMateria } from './IconoMateria';
import { Pendiente } from './Pendiente';

/**
 * La red PERITUS: qué es, quién entra y cómo se entra.
 *
 * ── Las dos lecturas ──
 * Esta sección la leen dos personas con intereses opuestos. El PERITO busca
 * trabajo. El ABOGADO —que es quien paga— busca saber quién va a firmar el
 * dictamen que él va a defender en audiencia. Antes el bloque solo le hablaba
 * al primero: cita, lista de requisitos, botón de registro. Leído por el
 * segundo, eso es un aviso clasificado, y la conclusión que deja es la peor
 * posible: que a esta red entra cualquiera.
 *
 * Ahora el orden es al revés. Primero el FILTRO —los mismos cuatro requisitos,
 * pero contados como lo que se verifica antes de que alguien firme— y solo
 * después la puerta del perito, reducida a una franja. Al abogado el filtro le
 * dice quién sustenta su dictamen; al perito le dice que pertenecer significa
 * algo. Es el mismo contenido leído desde el otro lado.
 *
 * ── La estructura ──
 *   1 · Qué es la red, y las seis disciplinas como banda de rótulos.
 *   2 · El filtro: el argumento y los cuatro puntos, con el esquema de
 *       verificación al lado.
 *   3 · La puerta del perito, en una franja: cita, cuatro pasos y botón.
 *
 * El esquema de la derecha es un ESQUEMA, no una credencial: renglones
 * tapados en vez de datos inventados, igual que la hoja de la anatomía del
 * dictamen. Prometer un carné que la red no emite sería justo el tipo de
 * mentira que a una firma pericial le cuesta el caso.
 */
export function RedPeritus() {
  const perito = perfiles.find((p) => p.id === 'perito');
  if (!perito || perito.cuerpo.clase !== 'pasos') return null;
  const pasos = perito.cuerpo.pasos;

  return (
    <section className="red" id="peritus" aria-labelledby="red-titulo">
      <div className="wrap">
        <div className="red__intro">
          <div>
            {/* La marca va como imagen y no como texto: es el activo que hay
                que hacer reconocible, y esta banda es la fusión hecha visible. */}
            <Image className="pmark" src="/images/peritus-blanco.png" alt="PERITUS" width={2004} height={548} />
            <h2 className="red__titulo" id="red-titulo">{redPeritus.titulo}</h2>
          </div>
          <p className="red__texto">{redPeritus.texto}</p>
        </div>

        {/* Las seis disciplinas en una banda de rótulos: una fila en lugar de
            una rejilla de seis tarjetas. Dice lo mismo en un tercio del alto. */}
        <ul className="disciplinas">
          {disciplinas.map((d) => (
            <li className={d.principal ? 'disc disc--principal' : 'disc'} key={d.nombre}>
              <span className="disc__icono">
                <IconoMateria nombre={d.icono} />
              </span>
              <span className="disc__nombre">{d.nombre}</span>
              <span className="disc__alcance">{d.alcance}</span>
              {d.principal && <span className="mono disc__sello">Origen CNP</span>}
            </li>
          ))}
        </ul>

        {/* ── el filtro ── */}
        <div className="filtro">
          <div className="filtro__decir">
            <p className="mono filtro__eyebrow">{admision.eyebrow}</p>
            <h3 className="filtro__titulo">
              {admision.titulo}
              <em> {admision.tituloDestacado}</em>
            </h3>
            <p className="filtro__texto">{admision.texto}</p>

            <h4 className="mono filtro__rotulo">{admision.rotulo}</h4>
            <ol className="filtro__lista">
              {admision.filtros.map((f, i) => (
                <li key={f.titulo}>
                  <span className="mono filtro__num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h5>{f.titulo}</h5>
                    <p>{f.texto}</p>
                  </div>
                  <span className="filtro__chulo" aria-hidden="true"><Chulo /></span>
                </li>
              ))}
            </ol>
          </div>

          {/*
            El esquema de verificación. Va `aria-hidden` a propósito: no aporta
            nada que el texto de al lado no diga ya, y leerle renglones tapados
            a alguien con lector de pantalla es ruido.
          */}
          <div className="verifica" aria-hidden="true">
            <div className="verifica__hoja">
              <div className="verifica__membrete">
                <span>{admision.sello.membrete}</span>
                <span className="verifica__folio">PERITUS</span>
              </div>

              {admision.sello.campos.map((campo) => (
                <div className="verifica__campo" key={campo}>
                  <span className="verifica__rotulo">{campo}</span>
                  <span className="verifica__barras">
                    <i className="ln ln--fuerte ln--70" />
                    <i className="ln ln--50" />
                  </span>
                  <span className="verifica__ok"><Chulo /></span>
                </div>
              ))}

              <div className="verifica__pie">
                <span className="verifica__rubrica" />
                <span className="verifica__sello">
                  <b>{admision.sello.marca}</b>
                  <small>{admision.sello.norma}</small>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── la puerta del perito ── */}
        <div className="puerta" id="perito">
          <div className="puerta__decir">
            <p className="mono puerta__eyebrow">{perito.pestana}</p>
            <blockquote className="puerta__cita">
              <p>{perito.enunciado.texto}</p>
            </blockquote>
            {perito.lateral.cta && (
              <a className="btn-oro puerta__cta" href={perito.lateral.cta.href}>
                {perito.lateral.cta.texto}
              </a>
            )}
          </div>

          <div>
            <h4 className="mono puerta__rotulo">Cómo se entra</h4>
            {/*
              Los pasos van solo con el título. Sus descripciones repetían casi
              palabra por palabra lo que el filtro ya dice arriba —"validamos la
              tarjeta que exige el art. 226 y clasificamos su disciplina"— y
              decir dos veces lo mismo en la misma sección le quita fuerza a las
              dos. La excepción es el último: "con criterio" no se explica solo,
              necesita decir sobre qué se decide (alcance y remuneración).
            */}
            <ol className="puerta__pasos">
              {pasos.map((paso, i) => (
                <li key={paso.titulo}>
                  <span className="mono puerta__num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h5>{paso.titulo}</h5>
                    {i === pasos.length - 1 && (
                      <p>
                        {paso.descripcion}
                        {paso.pendiente && (
                          <>
                            {' '}
                            <Pendiente>{paso.pendiente}</Pendiente>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {perito.lateral.nota && <p className="puerta__nota">{perito.lateral.nota}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function Chulo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}
