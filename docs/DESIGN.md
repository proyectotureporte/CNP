# Sistema visual — home pública CNP | PERITUS

## Alcance

La portada `/` usa un sistema visual propio y aislado bajo `.cnp-home`. Las demás landings públicas conservan su diseño actual y la aplicación operativa mantiene Inter mediante `InterAppScope`.

## Identidad

- Tipografía: DM Sans para interfaz y texto; Source Serif 4 para el titular principal y la garantía.
- Colores: azul noche `#07152e`, azul CNP `#0a2a6e`, azul de apoyo `#1a5fb4`, dorado `#c9a84c`, papel `#f8fafd` y superficies blancas.
- Elemento firma: composición en capas del hero —martillo, retrato recortado y tarjeta de disciplinas— acompañada por la retícula técnica horizontal.
- Materiales: bordes azul grisáceo, radios contenidos de 4–14 px y profundidad reservada a la tarjeta de disciplinas.

## Componentes

- `SiteHeader`: marca, navegación por anclas, CTA principal y acceso de peritos.
- `Hero` + `HeroMedia`: propuesta de valor, prueba cuantitativa y cobertura de seis disciplinas.
- `LogoRail`: prueba social temprana con logotipos normalizados.
- `FiltroPerfil`: siete pestañas accesibles con flechas de teclado, hash navegable y paneles por audiencia.
- `RedPeritus`, `CasosExito`, `Garantia`: red multidisciplinar, prueba de experiencia y compromiso de independencia.
- `Contacto`: formulario conectado a `/api/web-form`, con estados de envío, éxito y error anunciados mediante `aria-live`.
- `SiteFooter`: servicios, accesos, privacidad y datos corporativos.

## Responsive, interacción y accesibilidad

- Breakpoints principales: 1040, 900, 860, 760, 640, 620 y 560 px.
- El hero pasa a una columna y oculta únicamente el retrato decorativo en móvil; la tarjeta informativa permanece.
- El filtro conserva roles `tablist`, `tab` y `tabpanel`, selección visible y navegación con flechas.
- Todo control tiene foco visible dorado; los estados del formulario combinan color y texto.
- Las transiciones respetan `prefers-reduced-motion`; el diseño mantiene su esquema de marca en preferencias clara y oscura.
