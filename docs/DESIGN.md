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
- `AnchorNavigation`: desplazamiento de anclas con duración acotada, alineación exacta y soporte de movimiento reducido, historial y hashes directos.
- `Hero` + `HeroMedia`: propuesta de valor, prueba cuantitativa y cobertura de seis disciplinas.
- `LogoRail`: prueba social temprana con logotipos normalizados.
- `FiltroPerfil`: siete pestañas accesibles con flechas de teclado, hash navegable y paneles por audiencia.
- `RedPeritus`, `CasosExito`, `Garantia`: red multidisciplinar, prueba de experiencia y compromiso de independencia.
- `Contacto`: formulario conectado a `/api/web-form`, con estados de envío, éxito y error anunciados mediante `aria-live`.
- `SiteFooter`: servicios, accesos, privacidad y datos corporativos.

## Responsive, interacción y accesibilidad

- La composición del hero escala de forma fluida con `clamp()` y conserva dos columnas hasta 680 px; no cambia de estructura en el rango habitual de zoom de escritorio/tablet.
- En 680 px el hero pasa a una columna y oculta únicamente el retrato decorativo; la tarjeta informativa permanece. En 520 px la cabecera adopta dos filas y compensa la reducción vertical del hero.
- Los ajustes secundarios de las demás secciones se concentran en 860, 760, 640 y 560 px; la tarjeta del hero se compacta a dos columnas en 400 px.
- El filtro conserva roles `tablist`, `tab` y `tabpanel`, selección visible y navegación con flechas.
- Las anclas internas usan enlaces HTML y una animación propia de 300–480 ms; no pasan por el router de Next ni heredan el offset de 80 px de las landings antiguas.
- Todo control tiene foco visible dorado; los estados del formulario combinan color y texto.
- Las transiciones respetan `prefers-reduced-motion`; el diseño mantiene su esquema de marca en preferencias clara y oscura.
