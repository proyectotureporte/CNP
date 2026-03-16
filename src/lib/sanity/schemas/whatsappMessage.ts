export const whatsappMessageSchema = {
  name: 'whatsappMessage',
  title: 'Mensaje WhatsApp',
  type: 'document',
  fields: [
    {
      name: 'lead',
      title: 'Lead',
      type: 'reference',
      to: [{ type: 'whatsappLead' }],
    },
    {
      name: 'direction',
      title: 'Dirección',
      type: 'string',
      options: { list: ['incoming', 'outgoing'] },
    },
    { name: 'content', title: 'Contenido', type: 'text' },
    {
      name: 'sender',
      title: 'Remitente',
      type: 'string',
      options: { list: ['client', 'ai', 'agent'] },
    },
    { name: 'agentName', title: 'Nombre Agente', type: 'string' },
    { name: 'timestamp', title: 'Fecha/Hora', type: 'datetime' },
    { name: 'mediaUrl', title: 'URL Media', type: 'string' },
    { name: 'mediaType', title: 'Tipo Media', type: 'string' },
    { name: 'fileName', title: 'Nombre Archivo', type: 'string' },
  ],
};
