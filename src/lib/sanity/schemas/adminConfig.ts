export const adminConfigSchema = {
  name: 'adminConfig',
  title: 'Admin Config',
  type: 'document',
  fields: [
    { name: 'masterPasswordHash', title: 'Master Password Hash', type: 'string' },
    { name: 'secondaryPasswordHash', title: 'Secondary Password Hash', type: 'string' },
  ],
};
