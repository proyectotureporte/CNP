// Helpers de bajo nivel (pool, query, transacciones, builders)
export * from './pool';

// Repositorios por entidad. Uso: `import { cases } from '@/lib/db'; cases.listCases(...)`
export * as company from './company';
export * as crmClient from './crmClient';
export * as crmUser from './crmUser';
export * as cases from './cases';
export * as caseEvent from './caseEvent';
export * as caseDocument from './caseDocument';
export * as quote from './quote';
export * as expert from './expert';
export * as workPlan from './workPlan';
export * as workPlanActivity from './workPlanActivity';
export * as deliverable from './deliverable';
export * as evaluation from './evaluation';
export * as hearing from './hearing';
export * as payment from './payment';
export * as commission from './commission';
export * as notification from './notification';
export * as auditLog from './auditLog';
export * as systemSetting from './systemSetting';
export * as adminConfig from './adminConfig';
export * as registroPeritus from './registroPeritus';
export * as whatsappLead from './whatsappLead';
export * as whatsappMessage from './whatsappMessage';
export * as webLead from './webLead';
export * as stats from './stats';
export * as blogPost from './blogPost';
export * as siteContent from './siteContent';
