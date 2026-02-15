export const commissionSchema = {
  name: 'commission',
  title: 'Comision',
  type: 'document',
  fields: [
    { name: 'expert', title: 'Perito', type: 'reference', to: [{ type: 'crmUser' }] },
    { name: 'case', title: 'Caso', type: 'reference', to: [{ type: 'case' }] },
    { name: 'baseAmount', title: 'Monto Base', type: 'number' },
    { name: 'bonusPercentage', title: 'Bonus (%)', type: 'number', initialValue: 0 },
    { name: 'penaltyPercentage', title: 'Penalidad (%)', type: 'number', initialValue: 0 },
    { name: 'finalAmount', title: 'Monto Final', type: 'number' },
    {
      name: 'status',
      title: 'Estado',
      type: 'string',
      initialValue: 'pendiente',
      options: {
        list: [
          { title: 'Pendiente', value: 'pendiente' },
          { title: 'Pagada', value: 'pagada' },
          { title: 'Anulada', value: 'anulada' },
        ],
      },
    },
    { name: 'paymentDate', title: 'Fecha de Pago', type: 'datetime' },
    { name: 'paymentReference', title: 'Referencia de Pago', type: 'string' },
  ],
};
