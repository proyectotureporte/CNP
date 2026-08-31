import Image from 'next/image';
import { clientes } from '@/lib/content/home-unificado/clientes';

/**
 * Prueba social. Va inmediatamente después del hero.
 *
 * Antes era un riel de logos de 20 px al pie de la apertura: la lista de
 * clientes más fuerte que tiene la firma, reducida a decoración. Sube a sección
 * propia porque es el argumento que menos trabajo le cuesta al visitante
 * verificar — reconoce el logo o no lo reconoce.
 *
 * La composición es la retícula con filetes: cada celda abre con una línea, un
 * rótulo de sector en monoespaciada y el logo debajo. El filete da orden
 * documental; una marquesina en movimiento habría leído como banner y, con
 * ocho marcas, además delataría que la lista es corta.
 *
 * Va sobre banda clara entre dos secciones oscuras. La alternativa —fondo
 * navy— obligaría a aplanar los logos a blanco puro, y son marcas a color
 * pensadas para blanco: se pierde justo lo que las hace reconocibles.
 */
export function Clientes() {
  return (
    <section className="clientes" id="clientes" aria-labelledby="clientes-titulo">
      <div className="wrap">
        <div className="clientes__head">
          <div>
            <p className="mono clientes__eyebrow">Confiaron en nosotros</p>
            {/*
              El titular tiene que nombrar los sectores que la retícula muestra,
              no otros. Decía "bancos, hospitales, energía y sector público"
              cuando ya no hay ningún logo de salud ni de energía abajo — y esta
              es una firma que se vende como la que revisa lo que los demás
              afirman de más.
            */}
            <h2 className="clientes__titulo" id="clientes-titulo">
              Bancos, sector público y grandes empresas
              <em> ya nos pusieron a sustentar.</em>
            </h2>
          </div>
          <p className="clientes__nota">
            El dictamen no se defiende en la oficina: se defiende en audiencia, delante del juez y
            de la contraparte. Estas instituciones ya nos llevaron hasta ahí.
            <a className="clientes__enlace" href="#casos">
              Ver los casos
              <span aria-hidden="true"> →</span>
            </a>
          </p>
        </div>

        <ul className="marcas">
          {clientes.map((c) => (
            <li className="marca" key={c.nombre}>
              <span className="mono marca__sector">{c.sector}</span>
              <span className="marca__caja">
                <Image src={c.logo} alt={c.nombre} width={c.ancho} height={c.alto} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
