import type { NextConfig } from "next";

// NOTA: los headers de seguridad (CSP, HSTS, etc.) se aplican en server.js,
// porque con un servidor custom el `headers()` de next.config NO se ejecuta.
//
// `output: 'standalone'` NO se usa: genera su propio .next/standalone/server.js
// que reemplazaría a nuestro server.js custom y perdería el hub WebSocket (/ws).
// Desplegamos con `node server.js` sobre el repo completo (PM2).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
};

export default nextConfig;
