import Image from 'next/image';
import { disciplinas, redPeritus } from '@/lib/content/home-unificado/disciplinas';

/**
 * La red PERITUS.
 *
 * Aquí es donde la fusión se vuelve visible, y es el argumento comercial más
 * fuerte del cambio: hoy el 100% de quien entra por cnp.com.co solo ve la
 * especialidad financiera y nunca se entera de las otras cinco disciplinas que
 * el grupo puede vender.
 *
 * PERITUS no se disuelve. Deja de ser un dominio aparte —que competía con CNP
 * por la misma búsqueda— y pasa a ser el nombre de la red de peritos, que es
 * como ya se comporta: el título de peritus.com.co dice, literalmente,
 * "PERITUS - Centro Nacional de Pruebas Periciales".
 */
export function RedPeritus() {
  return (
    <section className="red">
      <div className="wrap">
        <div>
          <Image
            className="pmark"
            src="/images/peritus-blanco.png"
            alt="PERITUS"
            width={2004}
            height={548}
          />
          <h2>{redPeritus.titulo}</h2>
          <p>{redPeritus.texto}</p>
        </div>

        <ul className="disciplinas">
          {disciplinas.map((disciplina) => (
            <li key={disciplina.nombre} className={disciplina.principal ? 'principal' : undefined}>
              <b>{disciplina.nombre}</b>
              <span>{disciplina.alcance}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
