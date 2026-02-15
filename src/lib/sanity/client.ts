import { createClient } from 'next-sanity';
import { createClient as createSanityClient } from '@sanity/client';

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
};

export const client = createClient(config);

export const writeClient = createSanityClient({
  ...config,
  token: process.env.SANITY_API_TOKEN!,
});
