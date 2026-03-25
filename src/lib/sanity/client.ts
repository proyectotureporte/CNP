import { createClient } from 'next-sanity';
import { createClient as createSanityClient } from '@sanity/client';

const baseConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
};

export const client = createClient({
  ...baseConfig,
  perspective: 'published' as const,
});

export const writeClient = createSanityClient({
  ...baseConfig,
  token: process.env.SANITY_API_TOKEN!,
});
