export const evaluationSchema = {
  name: 'evaluation',
  title: 'Evaluacion',
  type: 'document',
  fields: [
    { name: 'case', title: 'Caso', type: 'reference', to: [{ type: 'case' }] },
    { name: 'expert', title: 'Perito', type: 'reference', to: [{ type: 'crmUser' }] },
    { name: 'punctualityScore', title: 'Puntualidad (1-5)', type: 'number' },
    { name: 'qualityScore', title: 'Calidad (1-5)', type: 'number' },
    { name: 'serviceScore', title: 'Servicio (1-5)', type: 'number' },
    { name: 'finalScore', title: 'Puntaje Final', type: 'number' },
    { name: 'clientFeedback', title: 'Feedback Cliente', type: 'text' },
    { name: 'technicalFeedback', title: 'Feedback Tecnico', type: 'text' },
    { name: 'evaluatedBy', title: 'Evaluado Por', type: 'reference', to: [{ type: 'crmUser' }] },
  ],
};
