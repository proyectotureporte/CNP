export const crmUserSchema = {
  name: 'crmUser',
  title: 'Usuario del Sistema',
  type: 'document',
  fields: [
    { name: 'username', title: 'Username', type: 'string' },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'displayName', title: 'Nombre Completo', type: 'string' },
    { name: 'phone', title: 'Telefono', type: 'string' },
    { name: 'passwordHash', title: 'Password Hash', type: 'string' },
    {
      name: 'role',
      title: 'Rol',
      type: 'string',
      options: {
        list: [
          { title: 'Administrador', value: 'admin' },
          { title: 'Asesor Comercial', value: 'comercial' },
          { title: 'Analista Tecnico', value: 'tecnico' },
          { title: 'Perito', value: 'perito' },
          { title: 'Cliente (Abogado)', value: 'cliente' },
          { title: 'Finanzas', value: 'finanzas' },
          { title: 'Comite Tecnico', value: 'comite' },
        ],
      },
      initialValue: 'comercial',
    },
    { name: 'active', title: 'Activo', type: 'boolean', initialValue: true },
    { name: 'avatarUrl', title: 'Avatar URL', type: 'string' },
    {
      name: 'companyRef',
      title: 'Empresa',
      type: 'reference',
      to: [{ type: 'company' }],
    },
  ],
};
