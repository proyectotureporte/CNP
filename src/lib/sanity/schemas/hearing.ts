export const hearingSchema = {
  name: 'hearing',
  title: 'Audiencia',
  type: 'document',
  fields: [
    { name: 'case', title: 'Caso', type: 'reference', to: [{ type: 'case' }] },
    { name: 'scheduledDate', title: 'Fecha Programada', type: 'datetime' },
    { name: 'location', title: 'Ubicacion', type: 'string' },
    { name: 'courtName', title: 'Juzgado', type: 'string' },
    { name: 'judgeName', title: 'Juez', type: 'string' },
    { name: 'expertAttended', title: 'Asistio Perito', type: 'boolean', initialValue: false },
    { name: 'clientAttended', title: 'Asistio Cliente', type: 'boolean', initialValue: false },
    { name: 'durationMinutes', title: 'Duracion (min)', type: 'number' },
    {
      name: 'result',
      title: 'Resultado',
      type: 'string',
      initialValue: 'pendiente',
      options: {
        list: [
          { title: 'Favorable', value: 'favorable' },
          { title: 'Desfavorable', value: 'desfavorable' },
          { title: 'Aplazada', value: 'aplazada' },
          { title: 'Pendiente', value: 'pendiente' },
        ],
      },
    },
    { name: 'notes', title: 'Notas', type: 'text' },
    { name: 'followUpRequired', title: 'Requiere Seguimiento', type: 'boolean', initialValue: false },
  ],
};
