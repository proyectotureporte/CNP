-- 006_blog_y_site_content.sql
-- Blog público (tarjetas de /masterclass + /blog + /blog/[slug]) gestionado
-- desde el panel /seguimiento de total, y almacén de contenido editable de las
-- webs públicas (panel /santiago). La tabla site_content es COMPARTIDA con
-- PERITUS (misma BD `cnp`, columna site distingue el sitio) — por eso el GRANT.

BEGIN;

CREATE TABLE IF NOT EXISTS blog_post (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  titulo            TEXT NOT NULL,
  extracto          TEXT NOT NULL DEFAULT '',
  categoria         TEXT NOT NULL DEFAULT 'Análisis financiero',
  imagen_url        TEXT NOT NULL DEFAULT '',
  contenido_html    TEXT NOT NULL DEFAULT '',
  tags              JSONB NOT NULL DEFAULT '[]'::jsonb,
  publicado         BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_publicacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_post_publicado
  ON blog_post (publicado, fecha_publicacion DESC);

DROP TRIGGER IF EXISTS blog_post_set_updated_at ON blog_post;
CREATE TRIGGER blog_post_set_updated_at
  BEFORE UPDATE ON blog_post
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS site_content (
  site       TEXT NOT NULL,
  page       TEXT NOT NULL,
  valor      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (site, page)
);

-- PERITUS comparte esta BD con su propio rol.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'peritus_user') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON site_content TO peritus_user;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Seeds: las 4 tarjetas actuales del apartado Blog de /masterclass.
-- El artículo de anatocismo entra PUBLICADO con su contenido completo
-- (plantilla blog-anatocismo); los otros 3 quedan como borradores
-- ("Próximamente") listos para editarse desde /seguimiento → Blog.
-- ---------------------------------------------------------------------------

INSERT INTO blog_post (id, slug, titulo, extracto, categoria, imagen_url, contenido_html, tags, publicado, fecha_publicacion)
VALUES (
  'blog-anatocismo-seed',
  'anatocismo-intereses-de-mora-y-usura',
  'Anatocismo, intereses de mora y usura: cuando una deuda necesita revisión técnica',
  'En el ámbito jurídico y financiero, es común encontrar obligaciones que, con el paso del tiempo, se vuelven difíciles de comprender. Una revisión técnica puede marcar la diferencia entre una deuda justa y un cobro injustificado.',
  'Análisis financiero',
  '/images/blog/articulo-anatocismo.png',
  $CONTENIDO$<p>En el ámbito jurídico y financiero, es común encontrar obligaciones que, con el paso del tiempo, se vuelven difíciles de comprender para las partes. En estos escenarios, los intereses se acumulan y la deuda original puede parecer mucho mayor de lo que en un inicio fue acordado. La aplicación indebida de prácticas como el anatocismo, los intereses de mora desproporcionados o tasas que pueden superar el límite de la usura.</p>
<p>Una revisión técnica y especializada puede marcar la diferencia entre una deuda justa y un cobro injustificado.</p>
<h2>¿Qué es el anatocismo y por qué puede ser problemático?</h2>
<p>El anatocismo se refiere a la capitalización de intereses, es decir, cuando los intereses generados se suman al capital y, posteriormente, también generan nuevos intereses. Aunque puede estar pactado contractualmente, su aplicación está limitada en el derecho colombiano.</p>
<blockquote class="aquote"><span class="aquote__mark" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M10 7H6a3 3 0 0 0-3 3v7h7v-7H6.5A1.5 1.5 0 0 1 8 8.5V7zm11 0h-4a3 3 0 0 0-3 3v7h7v-7h-3.5A1.5 1.5 0 0 1 19 8.5V7z" transform="scale(1,-1) translate(0,-24)"/></svg></span><div><p>La ley prohíbe el anatocismo, salvo que exista pacto expreso entre las partes y solo sobre intereses vencidos no pagados en obligaciones mercantiles.</p><cite>Código de Comercio, Art. 886.</cite></div></blockquote>
<h2>Intereses de mora: ¿hasta dónde son legales?</h2>
<p>Los intereses de mora tienen como finalidad compensar el incumplimiento. Sin embargo, cuando se pactan o aplican tasas excesivas, pueden convertirse en una carga desproporcionada para el deudor y ser objeto de revisión judicial.</p>
<p>Una tasa de mora válida debe estar dentro de los límites establecidos por la Superintendencia Financiera y nunca puede tener un carácter sancionatorio o abusivo.</p>
<h2>Usura: el límite que protege al deudor</h2>
<p>La usura ocurre cuando la tasa de interés supera significativamente el promedio del mercado, afectando de forma desproporcionada al deudor. El cobro de intereses usurarios puede dar lugar a consecuencias como la nulidad del contrato o a la devolución judicial de los dineros.</p>
<h2>¿Cómo puede ayudar una prueba pericial financiera?</h2>
<p>Una prueba financiera permite analizar a profundidad las condiciones de una deuda, verificar la legalidad de los intereses aplicados y determinar si existen cobros indebidos. Este análisis técnico se convierte en una herramienta clave para:</p>
<ul class="checks">
<li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>Detectar cobros por encima de los límites legales.</li>
<li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>Cuantificar el valor real de la obligación.</li>
<li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>Respaldar defensas jurídicas con evidencia técnica sólida.</li>
<li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>Facilitar acuerdos justos entre las partes.</li>
</ul>
<p>Cuando una deuda parece impagable, el primer paso no siempre es negociar: a veces, es revisar. La información correcta puede cambiar el rumbo de un proceso.</p>$CONTENIDO$,
  '["Anatocismo","Intereses de mora","Usura","Liquidación financiera","Prueba pericial financiera","Revisión técnica de deudas"]'::jsonb,
  TRUE,
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_post (id, slug, titulo, extracto, categoria, imagen_url, contenido_html, publicado, fecha_publicacion) VALUES
(
  'blog-dictamen-seed',
  'el-valor-del-dictamen-pericial-en-juicio',
  'El valor del dictamen pericial en juicio',
  'Por qué un dictamen técnico sólido puede definir el rumbo probatorio de un proceso judicial.',
  'Prueba pericial',
  '/images/masterclass/blog-dictamen-pericial.webp',
  '',
  FALSE,
  now()
),
(
  'blog-errores-seed',
  'errores-frecuentes-en-la-prueba-tecnica',
  'Errores frecuentes en la prueba técnica',
  'Identifique los errores más comunes y evite afectaciones legales.',
  'Análisis financiero',
  '/images/masterclass/blog-errores-prueba.webp',
  '',
  FALSE,
  now()
),
(
  'blog-estrategia-seed',
  'como-fortalecer-la-estrategia-probatoria',
  'Cómo fortalecer la estrategia probatoria',
  'Utilice una prueba pericial financiera sólida en el proceso judicial.',
  'Técnico-jurídico',
  '/images/masterclass/blog-estrategia-probatoria.webp',
  '',
  FALSE,
  now()
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
