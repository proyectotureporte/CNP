export const auditLogSchema = {
  name: 'auditLog',
  title: 'Registro de Auditoria',
  type: 'document',
  fields: [
    { name: 'user', title: 'Usuario', type: 'reference', to: [{ type: 'crmUser' }] },
    { name: 'action', title: 'Accion', type: 'string' },
    { name: 'entityType', title: 'Tipo de Entidad', type: 'string' },
    { name: 'entityId', title: 'ID de Entidad', type: 'string' },
    { name: 'oldValues', title: 'Valores Anteriores', type: 'text' },
    { name: 'newValues', title: 'Valores Nuevos', type: 'text' },
    { name: 'ipAddress', title: 'Direccion IP', type: 'string' },
  ],
};
