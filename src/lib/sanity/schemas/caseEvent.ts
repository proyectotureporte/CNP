export const caseEventSchema = {
  name: 'caseEvent',
  title: 'Evento de Caso',
  type: 'document',
  fields: [
    {
      name: 'case',
      title: 'Caso',
      type: 'reference',
      to: [{ type: 'case' }],
    },
    {
      name: 'eventType',
      title: 'Tipo de Evento',
      type: 'string',
      options: {
        list: [
          { title: 'Caso Creado', value: 'case_created' },
          { title: 'Estado Cambiado', value: 'status_changed' },
          { title: 'Asignacion', value: 'assignment' },
          { title: 'Documento Subido', value: 'document_uploaded' },
          { title: 'Cotizacion Creada', value: 'quote_created' },
          { title: 'Cotizacion Aprobada', value: 'quote_approved' },
          { title: 'Cotizacion Rechazada', value: 'quote_rejected' },
          { title: 'Entrega Enviada', value: 'deliverable_submitted' },
          { title: 'Entrega Aprobada', value: 'deliverable_approved' },
          { title: 'Pago Registrado', value: 'payment_recorded' },
          { title: 'Comentario', value: 'comment' },
          { title: 'Otro', value: 'other' },
        ],
      },
    },
    { name: 'description', title: 'Descripcion', type: 'text' },
    {
      name: 'createdBy',
      title: 'Creado Por',
      type: 'reference',
      to: [{ type: 'crmUser' }],
    },
    { name: 'createdByName', title: 'Nombre del Creador', type: 'string' },
    { name: 'metadata', title: 'Metadata', type: 'text', description: 'JSON con datos adicionales del evento' },
  ],
};
