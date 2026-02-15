'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { adminConfigSchema } from './src/lib/sanity/schemas/adminConfig'
import { crmUserSchema } from './src/lib/sanity/schemas/crmUser'
import { crmClientSchema } from './src/lib/sanity/schemas/crmClient'
import { companySchema } from './src/lib/sanity/schemas/company'
import { caseSchema } from './src/lib/sanity/schemas/case'
import { caseEventSchema } from './src/lib/sanity/schemas/caseEvent'
import { caseDocumentSchema } from './src/lib/sanity/schemas/caseDocument'
import { quoteSchema } from './src/lib/sanity/schemas/quote'
import { expertSchema } from './src/lib/sanity/schemas/expert'
import { workPlanSchema } from './src/lib/sanity/schemas/workPlan'
import { deliverableSchema } from './src/lib/sanity/schemas/deliverable'
import { evaluationSchema } from './src/lib/sanity/schemas/evaluation'
import { hearingSchema } from './src/lib/sanity/schemas/hearing'
import { paymentSchema } from './src/lib/sanity/schemas/payment'
import { commissionSchema } from './src/lib/sanity/schemas/commission'
import { notificationSchema } from './src/lib/sanity/schemas/notification'
import { auditLogSchema } from './src/lib/sanity/schemas/auditLog'
import { systemSettingSchema } from './src/lib/sanity/schemas/systemSetting'

export default defineConfig({
  name: 'cnp-peritus',
  title: 'CNP | PERITUS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: '/studio',
  plugins: [structureTool()],
  schema: {
    types: [
      adminConfigSchema,
      crmUserSchema,
      crmClientSchema,
      companySchema,
      caseSchema,
      caseEventSchema,
      caseDocumentSchema,
      quoteSchema,
      expertSchema,
      workPlanSchema,
      deliverableSchema,
      evaluationSchema,
      hearingSchema,
      paymentSchema,
      commissionSchema,
      notificationSchema,
      auditLogSchema,
      systemSettingSchema,
    ],
  },
})
