export const notificationSchema = {
  name: 'notification',
  title: 'Notificacion',
  type: 'document',
  fields: [
    { name: 'user', title: 'Usuario', type: 'reference', to: [{ type: 'crmUser' }] },
    {
      name: 'type',
      title: 'Tipo',
      type: 'string',
      initialValue: 'info',
      options: {
        list: [
          { title: 'Info', value: 'info' },
          { title: 'Warning', value: 'warning' },
          { title: 'Success', value: 'success' },
          { title: 'Error', value: 'error' },
        ],
      },
    },
    {
      name: 'priority',
      title: 'Prioridad',
      type: 'string',
      initialValue: 'normal',
      options: {
        list: [
          { title: 'Baja', value: 'baja' },
          { title: 'Normal', value: 'normal' },
          { title: 'Alta', value: 'alta' },
        ],
      },
    },
    { name: 'title', title: 'Titulo', type: 'string' },
    { name: 'message', title: 'Mensaje', type: 'text' },
    { name: 'linkUrl', title: 'URL', type: 'string' },
    { name: 'isRead', title: 'Leida', type: 'boolean', initialValue: false },
    { name: 'readAt', title: 'Leida En', type: 'datetime' },
  ],
};
