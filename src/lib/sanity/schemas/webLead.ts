export const webLeadSchema = {
  name: 'webLead',
  title: 'Formulario Web',
  type: 'document',
  fields: [
    { name: 'nombre', title: 'Nombre', type: 'string' },
    { name: 'email', title: 'Correo', type: 'string' },
    { name: 'mensaje', title: 'Mensaje', type: 'text' },
    {
      name: 'origen',
      title: 'Origen',
      type: 'string',
      options: {
        list: [
          { title: 'Landing', value: 'landing' },
          { title: 'Abogados', value: 'abogados' },
          { title: 'Empresas', value: 'empresas' },
          { title: 'Jueces', value: 'jueces' },
        ],
      },
      initialValue: 'landing',
    },
    {
      name: 'estado',
      title: 'Estado',
      type: 'string',
      options: {
        list: [
          { title: 'Nuevo', value: 'nuevo' },
          { title: 'En gestión', value: 'en_gestion' },
          { title: 'Convertido', value: 'convertido' },
          { title: 'Descartado', value: 'descartado' },
        ],
      },
      initialValue: 'nuevo',
    },
    { name: 'notas', title: 'Notas internas', type: 'text' },
  ],
};
