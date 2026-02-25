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
          { title: 'Juridico', value: 'juridico' },
          { title: 'Financiero', value: 'financiero' },
          { title: 'Administrativo', value: 'administrativo' },
          { title: 'Mercadeo', value: 'mercadeo' },
          { title: 'Post Venta', value: 'postventa' },
          { title: 'Cliente', value: 'cliente' },
        ],
      },
      initialValue: 'juridico',
    },
    { name: 'active', title: 'Activo', type: 'boolean', initialValue: true },
    { name: 'mustChangePassword', title: 'Debe Cambiar Contrasena', type: 'boolean', initialValue: false },
    { name: 'avatarUrl', title: 'Avatar URL', type: 'string' },
    {
      name: 'companyRef',
      title: 'Empresa',
      type: 'reference',
      to: [{ type: 'company' }],
    },
  ],
};
