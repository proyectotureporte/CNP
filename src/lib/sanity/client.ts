import { createClient } from '@sanity/client';

// Sanity se conserva ÚNICAMENTE como almacenamiento de archivos (assets).
// Este cliente con token de escritura se usa solo para subir/borrar assets
// (ver src/lib/sanity/assets.ts). Toda la data estructurada vive en PostgreSQL.
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});
