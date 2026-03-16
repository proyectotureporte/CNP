export const whatsappLeadSchema = {
  name: 'whatsappLead',
  title: 'Lead WhatsApp',
  type: 'document',
  fields: [
    { name: 'phone', title: 'Teléfono', type: 'string' },
    { name: 'name', title: 'Nombre', type: 'string' },
    { name: 'city', title: 'Ciudad', type: 'string' },
    { name: 'motive', title: 'Motivo', type: 'text' },
    {
      name: 'brand',
      title: 'Marca',
      type: 'string',
      options: { list: ['CNP', 'Peritus'] },
      initialValue: 'Peritus',
    },
    {
      name: 'status',
      title: 'Estado',
      type: 'string',
      options: {
        list: [
          { title: 'Nuevo', value: 'nuevo' },
          { title: 'En conversación', value: 'en_conversacion' },
          { title: 'Completado', value: 'completado' },
          { title: 'Descartado', value: 'descartado' },
          { title: 'Convertido', value: 'convertido' },
        ],
      },
      initialValue: 'nuevo',
    },
    { name: 'aiCompleted', title: 'IA Completó', type: 'boolean', initialValue: false },
    { name: 'aiSummary', title: 'Resumen IA', type: 'text' },
    { name: 'notes', title: 'Notas', type: 'text' },
    {
      name: 'convertedClient',
      title: 'Cliente Convertido',
      type: 'reference',
      to: [{ type: 'crmClient' }],
    },
    {
      name: 'documents',
      title: 'Documentos',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'fileName', title: 'Nombre', type: 'string' },
            { name: 'mimeType', title: 'Tipo MIME', type: 'string' },
            { name: 'file', title: 'Archivo', type: 'file' },
          ],
        },
      ],
    },
    { name: 'lastMessageAt', title: 'Último mensaje', type: 'datetime' },
    { name: 'unreadCount', title: 'No leídos', type: 'number', initialValue: 0 },
  ],
};
