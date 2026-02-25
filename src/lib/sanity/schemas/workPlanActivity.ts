export const workPlanActivitySchema = {
  name: 'workPlanActivity',
  title: 'Actividad de Plan de Trabajo',
  type: 'document',
  fields: [
    { name: 'workPlan', title: 'Plan de Trabajo', type: 'reference', to: [{ type: 'workPlan' }] },
    { name: 'case', title: 'Caso', type: 'reference', to: [{ type: 'case' }] },
    { name: 'title', title: 'Titulo', type: 'string', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'description', title: 'Notas', type: 'text' },
    { name: 'dueDate', title: 'Fecha Limite', type: 'datetime' },
    {
      name: 'status',
      title: 'Estado',
      type: 'string',
      initialValue: 'pendiente',
      options: {
        list: [
          { title: 'Pendiente', value: 'pendiente' },
          { title: 'En Progreso', value: 'en_progreso' },
          { title: 'Completada', value: 'completada' },
        ],
      },
    },
    { name: 'assignedTo', title: 'Encargado', type: 'reference', to: [{ type: 'crmUser' }] },
    {
      name: 'file',
      title: 'Documento/Avance',
      type: 'file',
    },
    { name: 'startedAt', title: 'Fecha de Inicio', type: 'datetime' },
    { name: 'completedAt', title: 'Completada En', type: 'datetime' },
    { name: 'createdBy', title: 'Creado Por', type: 'reference', to: [{ type: 'crmUser' }] },
  ],
};
