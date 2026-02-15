export const deliverableSchema = {
  name: 'deliverable',
  title: 'Entrega',
  type: 'document',
  fields: [
    { name: 'case', title: 'Caso', type: 'reference', to: [{ type: 'case' }] },
    {
      name: 'phase',
      title: 'Fase',
      type: 'string',
      options: {
        list: [
          { title: 'Marco Conceptual', value: 'marco_conceptual' },
          { title: 'Desarrollo Tecnico', value: 'desarrollo_tecnico' },
          { title: 'Dictamen Final', value: 'dictamen_final' },
        ],
      },
    },
    { name: 'phaseNumber', title: 'Numero de Fase', type: 'number' },
    { name: 'file', title: 'Archivo', type: 'file' },
    { name: 'fileName', title: 'Nombre Archivo', type: 'string' },
    { name: 'submittedBy', title: 'Enviado Por', type: 'reference', to: [{ type: 'crmUser' }] },
    {
      name: 'status',
      title: 'Estado',
      type: 'string',
      initialValue: 'enviado',
      options: {
        list: [
          { title: 'Enviado', value: 'enviado' },
          { title: 'En Revision', value: 'en_revision' },
          { title: 'Aprobado', value: 'aprobado' },
          { title: 'Rechazado', value: 'rechazado' },
        ],
      },
    },
    { name: 'reviewedBy', title: 'Revisado Por', type: 'reference', to: [{ type: 'crmUser' }] },
    { name: 'approvedBy', title: 'Aprobado Por', type: 'reference', to: [{ type: 'crmUser' }] },
    { name: 'comments', title: 'Comentarios', type: 'text' },
    { name: 'rejectionReason', title: 'Razon de Rechazo', type: 'text' },
    { name: 'version', title: 'Version', type: 'number', initialValue: 1 },
  ],
};
