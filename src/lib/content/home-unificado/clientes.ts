import type { Cliente } from '@/lib/content/home-unificado/types';

/**
 * Prueba social. Va en sección propia justo debajo del hero.
 *
 * Los logos van en su COLOR ORIGINAL sobre banda clara, no en silueta blanca:
 * casi todos son marcas a color pensadas para fondo blanco, y aplanarlas les
 * quita la identidad que es justamente lo que las hace reconocibles. La banda
 * clara entre dos secciones oscuras hace la jerarquía sola.
 *
 * Las medidas son las del archivo YA RECORTADO. Los ocho venían del sitio
 * publicado con mucho aire alrededor —cinco eran lienzos cuadrados de 500x500
 * con la marca chiquita en el centro— y un tope de alto en CSS se aplica al
 * lienzo, no a la marca: los cuadrados salían minúsculos al lado de
 * Bancolombia. Se recortaron a la caja real del trazo. Si se reemplaza un
 * archivo, hay que recortarlo igual y actualizar estas medidas.
 *
 * El `sector` es deliberado: nombra el ramo, nunca el litigio. Decir en qué
 * proceso se trabajó para un cliente sería un problema de confidencialidad;
 * decir que se trabajó para banca, no.
 *
 * Cuatro de estos logos están publicados hoy en cnp.com.co como "LOGON",
 * "LOGON1", "LOGON2" y "LOGON3" — para un buscador y para un lector de pantalla
 * no dicen nada. Se identificaron uno por uno abriendo los archivos.
 *
 * ── De dónde salió cada archivo nuevo ──
 * AV Villas, Banco Popular, Corficolombiana y Fortox se bajaron del sitio de la
 * propia institución, no de un banco de "logos gratis" —ahí circula material
 * reempaquetado y versiones viejas— y se recortaron igual que los demás.
 *
 * ⚠️ Los SVG de Wikimedia de AV Villas, Banco Popular y Corficolombiana están
 * DESACTUALIZADOS: se renderizaron los tres y muestran identidades anteriores
 * (AV Villas en azul cuando hoy es rojo y sin la palabra "Banco"; Popular en
 * verde oscuro cuando hoy es verde lima; Corficolombiana con el swoosh dorado).
 * Parecían la salida fácil y habrían puesto tres marcas viejas en la banda.
 *
 * ⚠️ Banco Popular: el único lockup a color oficial mide 249x35 y no da más.
 * A tamaño de banda funciona; en pantalla retina se va a ver blando. Si hace
 * falta más resolución hay que pedírsela al banco.
 *
 * ── Dos que NO están, y por qué ──
 * · **Colpatria** — la marca bancaria ya no existe. Davivienda cerró la compra
 *   de las operaciones de Scotiabank en Colombia el 1-dic-2025 y la entidad hoy
 *   es Banco DaviBank S.A.; Scotiabank anunció su salida del país el
 *   15-abr-2026. El trabajo se hizo para Colpatria, así que poner el logo de
 *   DaviBank representaría a una entidad distinta de la que contrató.
 * · **Universidad del Valle** — su Acuerdo 023 de 2003 PROHÍBE expresamente el
 *   uso del logosímbolo sin autorización del comité de propiedad intelectual y
 *   del comité editorial, y advierte acciones administrativas y penales. Hay
 *   que pedir permiso por escrito a la División de Comunicaciones. Además sus
 *   dos enlaces de descarga oficiales están rotos.
 */
export const clientes: readonly Cliente[] = [
  { nombre: 'Bancolombia', sector: 'Banca', logo: '/images/home-unificado/cliente-bancolombia.png', ancho: 1280, alto: 301 },
  { nombre: 'Davivienda', sector: 'Banca', logo: '/images/home-unificado/cliente-davivienda.png', ancho: 3400, alto: 443 },
  { nombre: 'Banco Falabella', sector: 'Banca', logo: '/images/home-unificado/cliente-banco-falabella.png', ancho: 432, alto: 134 },
  { nombre: 'Ruta N Medellín', sector: 'Innovación pública', logo: '/images/home-unificado/cliente-ruta-n-medellin.png', ancho: 382, alto: 219 },
  { nombre: 'Metrovía', sector: 'Transporte', logo: '/images/home-unificado/cliente-metrovia.png', ancho: 682, alto: 161 },
  { nombre: 'AV Villas', sector: 'Banca', logo: '/images/home-unificado/cliente-av-villas.png', ancho: 924, alto: 197 },
  { nombre: 'Banco Popular', sector: 'Banca', logo: '/images/home-unificado/cliente-banco-popular.png', ancho: 249, alto: 35 },
  { nombre: 'Corficolombiana', sector: 'Corporación financiera', logo: '/images/home-unificado/cliente-corficolombiana.png', ancho: 742, alto: 278 },
  { nombre: 'Fortox Security Group', sector: 'Seguridad privada', logo: '/images/home-unificado/cliente-fortox.png', ancho: 297, alto: 67 },
];
