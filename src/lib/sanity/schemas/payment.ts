export const paymentSchema = {
  name: 'payment',
  title: 'Pago',
  type: 'document',
  fields: [
    { name: 'case', title: 'Caso', type: 'reference', to: [{ type: 'case' }] },
    { name: 'quote', title: 'Cotizacion', type: 'reference', to: [{ type: 'quote' }] },
    { name: 'amount', title: 'Monto', type: 'number' },
    { name: 'paymentDate', title: 'Fecha de Pago', type: 'datetime' },
    {
      name: 'paymentMethod',
      title: 'Metodo de Pago',
      type: 'string',
      options: {
        list: [
          { title: 'Transferencia', value: 'transferencia' },
          { title: 'Cheque', value: 'cheque' },
          { title: 'Efectivo', value: 'efectivo' },
          { title: 'Tarjeta', value: 'tarjeta' },
          { title: 'Otro', value: 'otro' },
        ],
      },
    },
    {
      name: 'status',
      title: 'Estado',
      type: 'string',
      initialValue: 'pendiente',
      options: {
        list: [
          { title: 'Pendiente', value: 'pendiente' },
          { title: 'Completado', value: 'completado' },
          { title: 'Anulado', value: 'anulado' },
        ],
      },
    },
    { name: 'transactionReference', title: 'Referencia', type: 'string' },
    { name: 'receiptFile', title: 'Comprobante', type: 'file' },
    { name: 'notes', title: 'Notas', type: 'text' },
    { name: 'createdBy', title: 'Creado Por', type: 'reference', to: [{ type: 'crmUser' }] },
  ],
};
