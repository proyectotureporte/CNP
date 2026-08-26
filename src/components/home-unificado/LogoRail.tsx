import Image from 'next/image';
import { clientes } from '@/lib/content/home-unificado/clientes';

/**
 * Riel de clientes, inmediatamente debajo del titular.
 *
 * Sube desde el pie porque el 80% de la atención está en lo alto de la página,
 * y porque los logos son el mejor activo de confianza que tiene la empresa.
 *
 * El `alt` lleva el nombre real. Es el arreglo de diez minutos que más rinde:
 * hoy cuatro de estos logos están publicados como "LOGON", "LOGON1", "LOGON2" y
 * "LOGON3" y, para un buscador o un lector de pantalla, no dicen nada.
 */
export function LogoRail() {
  return (
    <div className="logo-rail">
      <div className="wrap">
        <span className="label">Confían en nosotros</span>
        <ul>
          {clientes.map((cliente) => (
            <li key={cliente.nombre}>
              <Image
                src={cliente.logo}
                alt={cliente.nombre}
                width={cliente.ancho}
                height={cliente.alto}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
