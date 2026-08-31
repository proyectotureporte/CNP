/**
 * Etiqueta amarilla para el dato que todavía no se puede afirmar.
 *
 * No es decoración: es un freno. Mientras esté en pantalla, ese texto no está
 * listo para publicarse. Antes de salir a producción no debería quedar ninguna
 * — se encuentran todas con: grep -rn "pendiente" content/
 */
export function Pendiente({ children }: { children: string }) {
  return <span className="pendiente">{children}</span>;
}
