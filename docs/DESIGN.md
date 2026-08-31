# Sistema visual — home pública CNP | PERITUS

## Alcance

La portada `/` usa un sistema editorial propio, aislado bajo `.cnp-home`. Las demás landings públicas conservan su diseño y la aplicación operativa mantiene Inter mediante `InterAppScope`.

Los componentes viven en `src/components/home-unificado/`, el contenido en `src/lib/content/home-unificado/`, los estilos en `src/app/home-unificado.css` y los assets exclusivos en `public/images/home-unificado/`.

## Identidad

- Tipografía: DM Sans para interfaz y texto; Source Serif 4 para titulares; JetBrains Mono para folios, pasos y rótulos técnicos.
- Colores: azul noche `#07152e`, azul CNP `#0a2a6e`, azul de apoyo `#1a5fb4`, dorado `#c9a84c`, papel `#f8fafd` y superficies blancas.
- Elemento firma: lenguaje de expediente pericial —filetes, folios, marcas de registro, rótulos monoespaciados y hojas técnicas— aplicado con contención.
- Materiales: fondos navy con trama documental, papel claro, bordes azul grisáceo, radios contenidos y profundidad reservada a expedientes, calificador y mapa.

## Recorrido y componentes

- `SiteHeader`: marca, navegación por anclas, WhatsApp, CTA principal y acceso discreto al bloque del perito.
- `Hero` + `Calificador`: propuesta de valor y solicitud accesible en tres pasos; el envío real termina en `/api/web-form`.
- `Clientes`: prueba social temprana con nueve marcas y sector declarado.
- `Trabajos`: cuatro encargos de cliente presentados como pila de expedientes.
- `Metodologia` + `AnatomiaDictamen`: pilares, anatomía interactiva y proceso de cinco pasos.
- `RedPeritus`: seis disciplinas, filtro de admisión y puerta de incorporación para peritos.
- `CasosExito`: registro filtrable por tipo de encargo y copia de radicados.
- `Nosotros`: manifiesto de independencia y ficha cuantitativa de la firma.
- `Garantia`, `Contacto` y `SiteFooter`: cierre institucional, formulario conectado al CRM, cobertura nacional y accesos.
- `AnchorNavigation`: desplazamiento de duración acotada, soporte de historial y movimiento reducido.

## Responsive, interacción y accesibilidad

- El hero usa dos columnas en escritorio y pasa a una composición lineal en móvil; el calificador conserva radios nativos, `fieldset`, `legend`, foco y anuncios `aria-live`.
- Los expedientes de `Trabajos` usan apilado sticky en pantallas amplias y una lectura lineal en móvil.
- El registro de casos conserva filtros con `aria-pressed`, radicados seleccionables y feedback de copia.
- Los dos formularios tienen validación nativa, autocomplete, estado de carga, confirmación y error accionable; nunca muestran éxito antes de una respuesta HTTP correcta.
- Todo control tiene foco visible dorado; los estados combinan texto, color e icono cuando corresponde.
- Las transiciones respetan `prefers-reduced-motion`.
- Los enlaces de ancla son HTML nativo y no pasan por el router de Next; las rutas reales usan `Link`.

## Reglas de aislamiento

- Ningún selector de `home-unificado.css` puede quedar fuera de `.cnp-home`.
- No importar el CSS del proyecto visual como `globals.css` ni modificar el `RootLayout` compartido.
- No sobrescribir assets homónimos de otras landings; los recursos propios de esta portada van en `public/images/home-unificado/`.
- No crear endpoints paralelos para la portada: ambos formularios usan `POST /api/web-form` con `origen: 'landing'`.
