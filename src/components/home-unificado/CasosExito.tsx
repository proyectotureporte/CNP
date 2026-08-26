import { casos } from '@/lib/content/home-unificado/casos';

/**
 * Casos de éxito, plegados.
 *
 * El acordeón permite texto extenso sin gastar pantalla: quien quiera el detalle
 * lo abre, y quien no, sigue bajando. Cada caso se cuenta en tres partes —
 * problema, qué hicimos, resultado — que es la estructura que un abogado
 * reconoce.
 *
 * Se usa <details>, no JavaScript: funciona sin hidratar y es accesible por
 * defecto.
 */
export function CasosExito() {
  return (
    <section className="casos" id="casos">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow">Casos de éxito</p>
          <h2>Qué hicimos, en casos que se pueden nombrar.</h2>
        </div>

        <div className="acc">
          {casos.map((caso) => (
            <details key={caso.titulo} open={caso.abiertoPorDefecto}>
              <summary>
                <span className="cliente">{caso.cliente}</span>
                <h3>{caso.titulo}</h3>
                <span className="chev" aria-hidden="true">
                  ▾
                </span>
              </summary>

              <div className="cuerpo">
                <div>
                  <h4>El problema</h4>
                  <p>{caso.problema}</p>
                </div>
                <div>
                  <h4>Qué hicimos</h4>
                  <p>{caso.hicimos}</p>
                </div>
                {caso.resultado && (
                  <div>
                    <h4>Resultado</h4>
                    <p>{caso.resultado}</p>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
