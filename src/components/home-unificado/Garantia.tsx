import { garantia } from '@/lib/content/home-unificado/sitio';

/**
 * La garantía.
 *
 * Es el único bloque de credibilidad del sitio actual que dice algo concreto y
 * no repetido — por eso sobrevive tal cual, y por eso los otros cuatro se funden
 * en él. Hoy "rigor" aparece 5 veces y "precisión" 4, repartidas en cuatro
 * bloques que cuestan cuatro pantallas y dicen lo mismo.
 */
export function Garantia() {
  return (
    <section className="garantia">
      <div className="wrap">
        <div className="rule" />
        <h2>{garantia.titulo}</h2>
        <p>{garantia.texto}</p>
      </div>
    </section>
  );
}
