// ============================================
// ADMIN CONFIG
// ============================================
export const getAdminConfigQuery = `*[_type == "adminConfig"][0]`;

// ============================================
// USERS
// ============================================
export const getCrmUserByUsernameQuery = `*[_type == "crmUser" && username == $username && active == true][0]`;

export const getCrmUserByEmailQuery = `*[_type == "crmUser" && email == $email && active == true][0]`;

export const getCrmUserByIdQuery = `*[_type == "crmUser" && _id == $id][0]`;

export const listAllCrmUsersQuery = `*[_type == "crmUser"] | order(_createdAt desc) {
  _id, _createdAt, _updatedAt, username, email, displayName, phone, role, active, avatarUrl,
  "company": companyRef->{ _id, name, type }
}`;

export const listCrmUsersByRoleQuery = `*[_type == "crmUser" && role == $role && active == true] | order(displayName asc) {
  _id, username, email, displayName, phone, role, active, avatarUrl,
  "company": companyRef->{ _id, name, type }
}`;

export const countActiveUsersQuery = `count(*[_type == "crmUser" && active == true])`;

export const countUsersByRoleQuery = `count(*[_type == "crmUser" && role == $role && active == true])`;

// ============================================
// CLIENTS
// ============================================
export const listClientsQuery = `*[_type == "crmClient" && ($search == "" || name match $search + "*" || email match $search + "*" || company match $search + "*")] | order(_createdAt desc)`;

export const getClientByIdQuery = `*[_type == "crmClient" && _id == $id][0]`;

export const countClientsQuery = `count(*[_type == "crmClient"])`;

export const recentClientsQuery = `*[_type == "crmClient"] | order(_createdAt desc) [0...5]`;

// ============================================
// COMPANIES
// ============================================
export const listCompaniesQuery = `*[_type == "company" && isActive == true] | order(name asc) {
  _id, name, nit, type, city, country, phone, isActive
}`;

export const getCompanyByIdQuery = `*[_type == "company" && _id == $id][0]`;

export const searchCompaniesQuery = `*[_type == "company" && (name match $search + "*" || nit match $search + "*")] | order(name asc)`;

// ============================================
// CASES
// ============================================

export const listCasesQuery = `*[_type == "case"
  && ($status == "" || status == $status)
  && ($discipline == "" || discipline == $discipline)
  && ($search == "" || title match $search + "*" || caseCode match $search + "*" || city match $search + "*")
] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, _updatedAt, caseCode, title, discipline, status, complexity, priority,
  estimatedAmount, hearingDate, deadlineDate, city, courtName, caseNumber,
  "client": client->{ _id, name, email, company },
  "commercial": commercial->{ _id, displayName, email },
  "assignedExpert": assignedExpert->{ _id, displayName, email }
}`;

export const countCasesQuery = `count(*[_type == "case"
  && ($status == "" || status == $status)
  && ($discipline == "" || discipline == $discipline)
  && ($search == "" || title match $search + "*" || caseCode match $search + "*" || city match $search + "*")
])`;

export const getCaseByIdQuery = `*[_type == "case" && _id == $id][0] {
  _id, _createdAt, _updatedAt, caseCode, title, description, discipline, status, complexity, priority,
  estimatedAmount, hearingDate, deadlineDate, city, courtName, caseNumber, riskScore,
  "client": client->{ _id, name, email, company, phone },
  "commercial": commercial->{ _id, displayName, email },
  "technicalAnalyst": technicalAnalyst->{ _id, displayName, email },
  "assignedExpert": assignedExpert->{ _id, displayName, email },
  "createdBy": createdBy->{ _id, displayName }
}`;

export const countCasesByStatusQuery = `{
  "creado": count(*[_type == "case" && status == "creado"]),
  "en_cotizacion": count(*[_type == "case" && status == "en_cotizacion"]),
  "pendiente_aprobacion": count(*[_type == "case" && status == "pendiente_aprobacion"]),
  "aprobado": count(*[_type == "case" && status == "aprobado"]),
  "en_asignacion": count(*[_type == "case" && status == "en_asignacion"]),
  "en_produccion": count(*[_type == "case" && status == "en_produccion"]),
  "en_revision": count(*[_type == "case" && status == "en_revision"]),
  "finalizado": count(*[_type == "case" && status == "finalizado"]),
  "archivado": count(*[_type == "case" && status == "archivado"]),
  "rechazado": count(*[_type == "case" && status == "rechazado"]),
  "total": count(*[_type == "case"])
}`;

export const getLatestCaseCodeQuery = `*[_type == "case" && caseCode match $prefix + "*"] | order(caseCode desc) [0] { caseCode }`;

export const listCasesByUserQuery = `*[_type == "case" && (
  commercial._ref == $userId ||
  technicalAnalyst._ref == $userId ||
  assignedExpert._ref == $userId ||
  createdBy._ref == $userId
)] | order(_createdAt desc) {
  _id, _createdAt, caseCode, title, discipline, status, complexity, priority,
  "client": client->{ _id, name, company },
  "commercial": commercial->{ _id, displayName }
}`;

// ============================================
// CASE EVENTS (TIMELINE)
// ============================================

export const listCaseEventsQuery = `*[_type == "caseEvent" && case._ref == $caseId] | order(_createdAt desc) {
  _id, _createdAt, eventType, description, createdByName,
  "createdBy": createdBy->{ _id, displayName }
}`;

export const countCaseEventsQuery = `count(*[_type == "caseEvent" && case._ref == $caseId])`;

// ============================================
// QUOTES
// ============================================

export const listCaseQuotesQuery = `*[_type == "quote" && case._ref == $caseId] | order(version desc) {
  _id, _createdAt, version, estimatedHours, hourlyRate, baseValue, expenses,
  marginPercentage, totalValue, discountPercentage, finalValue, status,
  validUntil, sentAt, approvedAt, rejectionReason, notes,
  "approvedBy": approvedBy->{ _id, displayName },
  "createdBy": createdBy->{ _id, displayName }
}`;

export const getQuoteByIdQuery = `*[_type == "quote" && _id == $id][0] {
  _id, _createdAt, version, estimatedHours, hourlyRate, baseValue, expenses,
  marginPercentage, totalValue, discountPercentage, finalValue, status,
  validUntil, sentAt, approvedAt, rejectionReason, notes,
  "approvedBy": approvedBy->{ _id, displayName },
  "createdBy": createdBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title }
}`;

export const countCaseQuotesQuery = `count(*[_type == "quote" && case._ref == $caseId])`;

export const listAllQuotesQuery = `*[_type == "quote" && ($status == "" || status == $status)] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, version, estimatedHours, hourlyRate, baseValue, expenses,
  marginPercentage, totalValue, discountPercentage, finalValue, status,
  validUntil, sentAt, approvedAt, rejectionReason, notes,
  "approvedBy": approvedBy->{ _id, displayName },
  "createdBy": createdBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title }
}`;

export const countAllQuotesQuery = `count(*[_type == "quote" && ($status == "" || status == $status)])`;

// ============================================
// CASE DOCUMENTS
// ============================================

export const listCaseDocumentsQuery = `*[_type == "caseDocument" && case._ref == $caseId
  && ($category == "" || category == $category)
] | order(_createdAt desc) {
  _id, _createdAt, category, fileName, fileSize, mimeType, version, isVisibleToClient, description,
  uploadedByName,
  "uploadedBy": uploadedBy->{ _id, displayName },
  "fileUrl": file.asset->url
}`;

export const getCaseDocumentByIdQuery = `*[_type == "caseDocument" && _id == $id][0] {
  _id, _createdAt, category, fileName, fileSize, mimeType, version, isVisibleToClient, description,
  uploadedByName,
  "uploadedBy": uploadedBy->{ _id, displayName },
  "fileUrl": file.asset->url
}`;

export const countCaseDocumentsQuery = `count(*[_type == "caseDocument" && case._ref == $caseId])`;

export const listCasesByClientQuery = `*[_type == "case" && client._ref == $clientId] | order(_createdAt desc) {
  _id, _createdAt, caseCode, title, discipline, status, complexity, priority,
  "commercial": commercial->{ _id, displayName }
}`;

// ============================================
// EXPERTS (PERITOS)
// ============================================

export const listExpertsQuery = `*[_type == "expert"
  && ($discipline == "" || $discipline in disciplines)
  && ($city == "" || city == $city)
  && ($availability == "" || availability == $availability)
  && ($validationStatus == "" || validationStatus == $validationStatus)
  && ($search == "" || specialization match $search + "*" || city match $search + "*" || taxId match $search + "*")
] | order(rating desc) [$start...$end] {
  _id, _createdAt, _updatedAt, disciplines, specialization, experienceYears, professionalCard,
  city, region, baseFee, feeCurrency, availability, rating, totalCases, completedCases,
  validationStatus, validationNotes, taxId,
  "user": user->{ _id, displayName, email, phone },
  "validatedBy": validatedBy->{ _id, displayName }
}`;

export const countExpertsQuery = `count(*[_type == "expert"
  && ($discipline == "" || $discipline in disciplines)
  && ($city == "" || city == $city)
  && ($availability == "" || availability == $availability)
  && ($validationStatus == "" || validationStatus == $validationStatus)
  && ($search == "" || specialization match $search + "*" || city match $search + "*" || taxId match $search + "*")
])`;

export const getExpertByIdQuery = `*[_type == "expert" && _id == $id][0] {
  _id, _createdAt, _updatedAt, disciplines, specialization, experienceYears, professionalCard,
  city, region, baseFee, feeCurrency, availability, rating, totalCases, completedCases,
  validationStatus, validationNotes, bankName, bankAccountType, bankAccountNumber, taxId,
  "user": user->{ _id, displayName, email, phone },
  "validatedBy": validatedBy->{ _id, displayName },
  "cvFileUrl": cvFile.asset->url,
  "certificationUrls": certificationFiles[].asset->url
}`;

export const getExpertByUserIdQuery = `*[_type == "expert" && user._ref == $userId][0] {
  _id, _createdAt, _updatedAt, disciplines, specialization, experienceYears, professionalCard,
  city, region, baseFee, feeCurrency, availability, rating, totalCases, completedCases,
  validationStatus, validationNotes,
  "user": user->{ _id, displayName, email, phone }
}`;

export const listAvailableExpertsForDisciplineQuery = `*[_type == "expert"
  && validationStatus == "aprobado"
  && availability == "disponible"
  && $discipline in disciplines
] | order(rating desc) {
  _id, disciplines, specialization, experienceYears, city, region, baseFee,
  availability, rating, totalCases, completedCases,
  "user": user->{ _id, displayName, email, phone }
}`;

export const countExpertsByStatusQuery = `{
  "pendiente": count(*[_type == "expert" && validationStatus == "pendiente"]),
  "aprobado": count(*[_type == "expert" && validationStatus == "aprobado"]),
  "rechazado": count(*[_type == "expert" && validationStatus == "rechazado"]),
  "total": count(*[_type == "expert"])
}`;

// ============================================
// WORK PLANS
// ============================================

export const getCaseWorkPlanQuery = `*[_type == "workPlan" && case._ref == $caseId] | order(_createdAt desc) [0] {
  _id, _createdAt, methodology, objectives, startDate, endDate, estimatedDays,
  deliverablesDescription, status, submittedAt, rejectionComments,
  "assignedExpert": assignedExpert->{ _id, displayName },
  "reviewedBy": reviewedBy->{ _id, displayName },
  "committeeApprovedBy": committeeApprovedBy->{ _id, displayName },
  "createdBy": createdBy->{ _id, displayName }
}`;

export const getWorkPlanByIdQuery = `*[_type == "workPlan" && _id == $id][0] {
  _id, _createdAt, methodology, objectives, startDate, endDate, estimatedDays,
  deliverablesDescription, status, submittedAt, rejectionComments,
  "assignedExpert": assignedExpert->{ _id, displayName },
  "reviewedBy": reviewedBy->{ _id, displayName },
  "committeeApprovedBy": committeeApprovedBy->{ _id, displayName },
  "createdBy": createdBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title }
}`;

// ============================================
// DELIVERABLES
// ============================================

export const listCaseDeliverablesQuery = `*[_type == "deliverable" && case._ref == $caseId] | order(phaseNumber asc, version desc) {
  _id, _createdAt, phase, phaseNumber, fileName, status, comments, rejectionReason, version,
  "fileUrl": file.asset->url,
  "submittedBy": submittedBy->{ _id, displayName },
  "reviewedBy": reviewedBy->{ _id, displayName },
  "approvedBy": approvedBy->{ _id, displayName }
}`;

export const getDeliverableByIdQuery = `*[_type == "deliverable" && _id == $id][0] {
  _id, _createdAt, phase, phaseNumber, fileName, status, comments, rejectionReason, version,
  "fileUrl": file.asset->url,
  "submittedBy": submittedBy->{ _id, displayName },
  "reviewedBy": reviewedBy->{ _id, displayName },
  "approvedBy": approvedBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title }
}`;

export const countCaseDeliverablesQuery = `count(*[_type == "deliverable" && case._ref == $caseId])`;

export const getCaseDeliverableProgressQuery = `{
  "marco_conceptual": count(*[_type == "deliverable" && case._ref == $caseId && phase == "marco_conceptual" && status == "aprobado"]) > 0,
  "desarrollo_tecnico": count(*[_type == "deliverable" && case._ref == $caseId && phase == "desarrollo_tecnico" && status == "aprobado"]) > 0,
  "dictamen_final": count(*[_type == "deliverable" && case._ref == $caseId && phase == "dictamen_final" && status == "aprobado"]) > 0
}`;

// ============================================
// EVALUATIONS
// ============================================

export const getCaseEvaluationQuery = `*[_type == "evaluation" && case._ref == $caseId][0] {
  _id, _createdAt, punctualityScore, qualityScore, serviceScore, finalScore,
  clientFeedback, technicalFeedback,
  "expert": expert->{ _id, displayName },
  "evaluatedBy": evaluatedBy->{ _id, displayName }
}`;

export const listExpertEvaluationsQuery = `*[_type == "evaluation" && expert._ref == $expertId] | order(_createdAt desc) {
  _id, _createdAt, punctualityScore, qualityScore, serviceScore, finalScore,
  clientFeedback, technicalFeedback,
  "evaluatedBy": evaluatedBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title }
}`;

export const getExpertAverageRatingQuery = `{
  "avgRating": math::avg(*[_type == "evaluation" && expert._ref == $expertId].finalScore),
  "totalEvaluations": count(*[_type == "evaluation" && expert._ref == $expertId])
}`;

// ============================================
// HEARINGS
// ============================================

export const listCaseHearingsQuery = `*[_type == "hearing" && case._ref == $caseId] | order(scheduledDate desc) {
  _id, _createdAt, scheduledDate, location, courtName, judgeName,
  expertAttended, clientAttended, durationMinutes, result, notes, followUpRequired
}`;

export const getHearingByIdQuery = `*[_type == "hearing" && _id == $id][0] {
  _id, _createdAt, scheduledDate, location, courtName, judgeName,
  expertAttended, clientAttended, durationMinutes, result, notes, followUpRequired,
  "case": case->{ _id, caseCode, title }
}`;

// ============================================
// PAYMENTS
// ============================================

export const listCasePaymentsQuery = `*[_type == "payment" && case._ref == $caseId] | order(_createdAt desc) {
  _id, _createdAt, amount, paymentDate, paymentMethod, status, transactionReference, notes,
  "createdBy": createdBy->{ _id, displayName }
}`;

export const listAllPaymentsQuery = `*[_type == "payment"
  && ($status == "" || status == $status)
] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, amount, paymentDate, paymentMethod, status, transactionReference, notes,
  "caseRef": case->{ _id, caseCode, title },
  "createdBy": createdBy->{ _id, displayName }
}`;

export const countAllPaymentsQuery = `count(*[_type == "payment" && ($status == "" || status == $status)])`;

export const getPaymentByIdQuery = `*[_type == "payment" && _id == $id][0] {
  _id, _createdAt, amount, paymentDate, paymentMethod, status, transactionReference, notes,
  "caseRef": case->{ _id, caseCode, title },
  "createdBy": createdBy->{ _id, displayName }
}`;

// ============================================
// COMMISSIONS
// ============================================

export const listExpertCommissionsQuery = `*[_type == "commission" && expert._ref == $expertId] | order(_createdAt desc) {
  _id, _createdAt, baseAmount, bonusPercentage, penaltyPercentage, finalAmount,
  status, paymentDate, paymentReference,
  "caseRef": case->{ _id, caseCode, title }
}`;

export const listAllCommissionsQuery = `*[_type == "commission"
  && ($status == "" || status == $status)
] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, baseAmount, bonusPercentage, penaltyPercentage, finalAmount,
  status, paymentDate, paymentReference,
  "expert": expert->{ _id, displayName },
  "caseRef": case->{ _id, caseCode, title }
}`;

export const countAllCommissionsQuery = `count(*[_type == "commission" && ($status == "" || status == $status)])`;

// ============================================
// NOTIFICATIONS
// ============================================

export const listUserNotificationsQuery = `*[_type == "notification" && user._ref == $userId
  && ($unreadOnly != true || isRead == false)
] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, type, priority, title, message, linkUrl, isRead, readAt
}`;

export const countUnreadNotificationsQuery = `count(*[_type == "notification" && user._ref == $userId && isRead == false])`;

// ============================================
// AUDIT LOGS
// ============================================

export const listAuditLogsQuery = `*[_type == "auditLog"] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, action, entityType, entityId, oldValues, newValues, ipAddress,
  "user": user->{ _id, displayName }
}`;

export const countAuditLogsQuery = `count(*[_type == "auditLog"])`;

// ============================================
// SYSTEM SETTINGS
// ============================================

export const listSystemSettingsQuery = `*[_type == "systemSetting"] | order(key asc) {
  _id, key, value, dataType, description
}`;

export const getSystemSettingQuery = `*[_type == "systemSetting" && key == $key][0] {
  _id, key, value, dataType, description
}`;

// ============================================
// DASHBOARD / STATS
// ============================================

export const getDashboardStatsQuery = `{
  "totalCases": count(*[_type == "case"]),
  "activeCases": count(*[_type == "case" && status in ["en_cotizacion", "pendiente_aprobacion", "aprobado", "en_asignacion", "en_produccion", "en_revision"]]),
  "totalClients": count(*[_type == "crmClient"]),
  "totalExperts": count(*[_type == "expert" && validationStatus == "aprobado"]),
  "pendingPayments": count(*[_type == "payment" && status == "pendiente"]),
  "casesByStatus": {
    "creado": count(*[_type == "case" && status == "creado"]),
    "en_cotizacion": count(*[_type == "case" && status == "en_cotizacion"]),
    "pendiente_aprobacion": count(*[_type == "case" && status == "pendiente_aprobacion"]),
    "aprobado": count(*[_type == "case" && status == "aprobado"]),
    "en_asignacion": count(*[_type == "case" && status == "en_asignacion"]),
    "en_produccion": count(*[_type == "case" && status == "en_produccion"]),
    "en_revision": count(*[_type == "case" && status == "en_revision"]),
    "finalizado": count(*[_type == "case" && status == "finalizado"])
  },
  "recentCases": *[_type == "case"] | order(_createdAt desc) [0...5] {
    _id, caseCode, title, status, discipline, _createdAt,
    "client": client->{ _id, name }
  },
  "totalRevenue": math::sum(*[_type == "payment" && status == "completado"].amount),
  "pendingActions": count(*[_type == "case" && status in ["pendiente_aprobacion", "en_revision"]])
}`;

// ============================================
// REPORTS
// ============================================

export const reportCasesQuery = `*[_type == "case"
  && ($startDate == "" || _createdAt >= $startDate)
  && ($endDate == "" || _createdAt <= $endDate)
  && ($discipline == "" || discipline == $discipline)
  && ($status == "" || status == $status)
] | order(_createdAt desc) {
  _id, _createdAt, caseCode, title, discipline, status, complexity, priority, estimatedAmount,
  "client": client->{ _id, name, company },
  "commercial": commercial->{ _id, displayName },
  "assignedExpert": assignedExpert->{ _id, displayName }
}`;

export const reportExpertsPerformanceQuery = `*[_type == "expert" && validationStatus == "aprobado"] | order(rating desc) {
  _id, disciplines, specialization, experienceYears, rating, totalCases, completedCases, availability,
  "user": user->{ _id, displayName, email }
}`;

export const reportRevenueQuery = `*[_type == "payment" && status == "completado"
  && ($startDate == "" || paymentDate >= $startDate)
  && ($endDate == "" || paymentDate <= $endDate)
] | order(paymentDate desc) {
  _id, amount, paymentDate, paymentMethod,
  "caseRef": case->{ _id, caseCode, title, discipline }
}`;
