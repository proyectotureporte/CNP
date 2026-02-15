export const systemSettingSchema = {
  name: 'systemSetting',
  title: 'Configuracion del Sistema',
  type: 'document',
  fields: [
    { name: 'key', title: 'Clave', type: 'string' },
    { name: 'value', title: 'Valor', type: 'string' },
    { name: 'dataType', title: 'Tipo de Dato', type: 'string', initialValue: 'string' },
    { name: 'description', title: 'Descripcion', type: 'string' },
  ],
};
