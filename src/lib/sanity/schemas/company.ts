export const companySchema = {
  name: 'company',
  title: 'Empresa / Firma',
  type: 'document',
  fields: [
    { name: 'name', title: 'Nombre', type: 'string' },
    { name: 'nit', title: 'NIT', type: 'string' },
    {
      name: 'type',
      title: 'Tipo',
      type: 'string',
      options: {
        list: [
          { title: 'Firma de Abogados', value: 'firma_abogados' },
          { title: 'Empresa', value: 'empresa' },
          { title: 'Particular', value: 'particular' },
        ],
      },
    },
    { name: 'address', title: 'Direccion', type: 'string' },
    { name: 'city', title: 'Ciudad', type: 'string' },
    { name: 'country', title: 'Pais', type: 'string', initialValue: 'Colombia' },
    { name: 'phone', title: 'Telefono', type: 'string' },
    { name: 'website', title: 'Sitio Web', type: 'string' },
    { name: 'billingEmail', title: 'Email de Facturacion', type: 'string' },
    { name: 'logoUrl', title: 'Logo URL', type: 'string' },
    { name: 'isActive', title: 'Activa', type: 'boolean', initialValue: true },
  ],
};
