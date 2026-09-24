import type { NextConfig } from "next";

// NOTA: los headers de seguridad (CSP, HSTS, etc.) se aplican en server.js,
// porque con un servidor custom el `headers()` de next.config NO se ejecuta.
//
// `output: 'standalone'` NO se usa: genera su propio .next/standalone/server.js
// que reemplazaría a nuestro server.js custom y perdería el hub WebSocket (/ws).
// Desplegamos con `node server.js` sobre el repo completo (PM2).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // El middleware recorta cuerpos >10 MB por defecto; los documentos admiten
    // hasta 50 MB por archivo (+ margen del multipart).
    proxyClientMaxBodySize: "55mb",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
};

export default nextConfig;
