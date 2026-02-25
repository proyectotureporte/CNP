export const crmClientSchema = {
  name: 'crmClient',
  title: 'Cliente CRM',
  type: 'document',
  fields: [
    {
      name: 'brand',
      title: 'Marca',
      type: 'string',
      options: { list: ['CNP', 'Peritus'] },
      initialValue: 'CNP',
    },
    { name: 'name', title: 'Nombre', type: 'string' },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'phone', title: 'Teléfono', type: 'string' },
    { name: 'company', title: 'Empresa', type: 'string' },
    { name: 'position', title: 'Cargo', type: 'string' },
    { name: 'notes', title: 'Notas', type: 'text' },
    {
      name: 'status',
      title: 'Estado',
      type: 'string',
      options: { list: ['activo', 'inactivo', 'prospecto'] },
    },
    { name: 'createdBy', title: 'Creado por', type: 'string' },
  ],
};
