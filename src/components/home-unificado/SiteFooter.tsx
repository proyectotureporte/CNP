import Image from 'next/image';
import Link from 'next/link';
import { columnasPie, pie } from '@/lib/content/home-unificado/sitio';

/**
 * Pie.
 *
 * Datos legales, el enlace a LinkedIn —a donde se muda el contenido de las
 * MasterClass, porque ahí llega a quien decide y ahí sí se mide— y los dos
 * accesos: peritos y CRM, que ya vive en cnp.com.co/crm.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="top">
          <div className="col col-marca">
            <Image
              className="fmark"
              src="/images/cnp-blanco.png"
              alt="Centro Nacional de Pruebas"
              width={1232}
              height={343}
            />
            <p>
              {pie.descripcion}
              <br />
              {pie.descripcionRed}
            </p>
          </div>

          {columnasPie.map((columna) => (
            <div className="col" key={columna.titulo}>
              <h5>{columna.titulo}</h5>
              <ul>
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.texto}>
                    {enlace.href.startsWith('#') ? (
                      <a href={enlace.href}>{enlace.texto}</a>
                    ) : (
                      <Link href={enlace.href}>{enlace.texto}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bottom">
          <span>{pie.legal}</span>
          <span>{pie.ciudad}</span>
        </div>
      </div>
    </footer>
  );
}
