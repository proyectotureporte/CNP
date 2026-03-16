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
export const listClientsQuery = `*[_type == "crmClient"
  && ($search == "" || name match $search + "*" || email match $search + "*" || company match $search + "*")
  && ($brand == "" || brand == $brand)
] | order(_createdAt desc)`;

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
  && status != "archivado"
  && ($status == "" || status == $status)
  && ($discipline == "" || discipline == $discipline)
  && ($brand == "" || ($brand == "CNP" && (!defined(brand) || brand == "CNP")) || brand == $brand)
  && ($search == "" || title match $search + "*" || caseCode match $search + "*" || city match $search + "*")
  && ($deadlineFilter == "" || (defined(deadlineDate) && deadlineDate <= $deadlineThreshold && !(status in ["cancelado"])))
  && ($financieroId == "" || assignedFinanciero._ref == $financieroId)
] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, _updatedAt, brand, caseCode, title, discipline, status, statusChangedByRole, complexity, priority,
  estimatedAmount, hasHearing, hearingDate, hearingLink, deadlineDate, city, courtName, caseNumber,
  "client": client->{ _id, name, email, company, brand },
  "commercial": commercial->{ _id, displayName, email },
  "assignedExpert": assignedExpert->{ _id, displayName, email },
  "assignedFinanciero": assignedFinanciero->{ _id, displayName, email }
}`;

export const countCasesQuery = `count(*[_type == "case"
  && status != "archivado"
  && ($status == "" || status == $status)
  && ($discipline == "" || discipline == $discipline)
  && ($brand == "" || ($brand == "CNP" && (!defined(brand) || brand == "CNP")) || brand == $brand)
  && ($search == "" || title match $search + "*" || caseCode match $search + "*" || city match $search + "*")
  && ($deadlineFilter == "" || (defined(deadlineDate) && deadlineDate <= $deadlineThreshold && !(status in ["cancelado"])))
  && ($financieroId == "" || assignedFinanciero._ref == $financieroId)
])`;

export const getCaseByIdQuery = `*[_type == "case" && _id == $id][0] {
  _id, _createdAt, _updatedAt, brand, caseCode, title, description, discipline, status, statusChangedByRole, complexity, priority,
  estimatedAmount, hasHearing, hearingDate, hearingLink, deadlineDate, city, courtName, caseNumber, riskScore,
  "client": client->{ _id, name, email, company, phone, brand },
  "commercial": commercial->{ _id, displayName, email },
  "technicalAnalyst": technicalAnalyst->{ _id, displayName, email },
  "assignedExpert": assignedExpert->{ _id, displayName, email },
  "assignedFinanciero": assignedFinanciero->{ _id, displayName, email },
  "createdBy": createdBy->{ _id, displayName }
}`;

export const countCasesByStatusQuery = `{
  "creado": count(*[_type == "case" && status == "creado"]),
  "gestionado": count(*[_type == "case" && status == "gestionado"]),
  "cancelado": count(*[_type == "case" && status == "cancelado"]),
  "total": count(*[_type == "case"])
}`;

export const getLatestCaseCodeQuery = `*[_type == "case" && caseCode match $prefix + "*"] | order(caseCode desc) [0] { caseCode }`;

export const listCasesByUserQuery = `*[_type == "case" && status != "archivado" && (
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
  _id, _createdAt, version, totalPrice, discountPercentage, finalValue, status,
  validUntil, sentAt, approvedAt, rejectionReason, notes,
  firstPaymentDate, lastPaymentDate, firstPaymentPercentage, customSplit,
  "quoteDocumentUrl": quoteDocument.asset->url,
  "approvedBy": approvedBy->{ _id, displayName },
  "createdBy": createdBy->{ _id, displayName }
}`;

export const getQuoteByIdQuery = `*[_type == "quote" && _id == $id][0] {
  _id, _createdAt, version, totalPrice, discountPercentage, finalValue, status,
  validUntil, sentAt, approvedAt, rejectionReason, notes,
  firstPaymentDate, lastPaymentDate, firstPaymentPercentage, customSplit,
  "quoteDocumentUrl": quoteDocument.asset->url,
  "approvedBy": approvedBy->{ _id, displayName },
  "createdBy": createdBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title }
}`;

export const countCaseQuotesQuery = `count(*[_type == "quote" && case._ref == $caseId])`;

export const listAllQuotesQuery = `*[_type == "quote" && ($status == "" || status == $status)] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, version, totalPrice, discountPercentage, finalValue, status,
  validUntil, sentAt, approvedAt, rejectionReason, notes,
  firstPaymentDate, lastPaymentDate, firstPaymentPercentage, customSplit,
  "quoteDocumentUrl": quoteDocument.asset->url,
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

export const listClientIdsForFinancieroQuery = `*[_type == "case" && assignedFinanciero._ref == $userId && defined(client)].client._ref`;

export const listClientsForFinancieroQuery = `*[_type == "crmClient"
  && _id in *[_type == "case" && assignedFinanciero._ref == $userId && defined(client)].client._ref
  && ($search == "" || name match $search + "*" || email match $search + "*" || company match $search + "*")
  && ($brand == "" || brand == $brand)
] | order(_createdAt desc)`;

export const listCasesByClientQuery = `*[_type == "case" && client._ref == $clientId && status != "archivado"] | order(_createdAt desc) {
  _id, _createdAt, caseCode, title, discipline, status, complexity, priority,
  "commercial": commercial->{ _id, displayName }
}`;

// ============================================
// PORTAL CLIENT QUERIES
// ============================================

export const listCasesForClientQuery = `*[_type == "case" && client._ref == $clientId && status != "archivado"] | order(_createdAt desc) {
  _id, _createdAt, _updatedAt, brand, caseCode, title, discipline, status, complexity, priority,
  estimatedAmount, hasHearing, hearingDate, deadlineDate, city, courtName, caseNumber,
  "client": client->{ _id, name, email, company, brand },
  "commercial": commercial->{ _id, displayName, email },
  "assignedExpert": assignedExpert->{ _id, displayName, email }
}`;

export const listClientVisibleDocumentsQuery = `*[_type == "caseDocument" && case._ref == $caseId && isVisibleToClient == true] | order(_createdAt desc) {
  _id, _createdAt, category, fileName, fileSize, mimeType, version, isVisibleToClient, description,
  uploadedByName,
  "uploadedBy": uploadedBy->{ _id, displayName },
  "fileUrl": file.asset->url
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

export const listAllWorkPlansQuery = `*[_type == "workPlan"
  && ($status == "" || status == $status)
] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, methodology, objectives, startDate, endDate, estimatedDays,
  deliverablesDescription, status, submittedAt, rejectionComments,
  "assignedExpert": assignedExpert->{ _id, displayName },
  "createdBy": createdBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title },
  "activityCounts": {
    "total": count(*[_type == "workPlanActivity" && workPlan._ref == ^._id]),
    "completadas": count(*[_type == "workPlanActivity" && workPlan._ref == ^._id && status == "completada"])
  }
}`;

export const countAllWorkPlansQuery = `count(*[_type == "workPlan"
  && ($status == "" || status == $status)
])`;

// ============================================
// WORK PLAN ACTIVITIES
// ============================================

export const listWorkPlanActivitiesQuery = `*[_type == "workPlanActivity" && case._ref == $caseId] | order(_createdAt asc) {
  _id, _createdAt, title, description, dueDate, status, startedAt, completedAt,
  "fileUrl": file.asset->url,
  "fileName": file.asset->originalFilename,
  "assignedTo": assignedTo->{ _id, displayName, role },
  "createdBy": createdBy->{ _id, displayName }
}`;

export const countActivitiesByStatusQuery = `{
  "total": count(*[_type == "workPlanActivity" && case._ref == $caseId]),
  "completadas": count(*[_type == "workPlanActivity" && case._ref == $caseId && status == "completada"]),
  "en_progreso": count(*[_type == "workPlanActivity" && case._ref == $caseId && status == "en_progreso"]),
  "pendientes": count(*[_type == "workPlanActivity" && case._ref == $caseId && status == "pendiente"])
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

export const listAllDeliverablesQuery = `*[_type == "deliverable"
  && ($status == "" || status == $status)
  && ($phase == "" || phase == $phase)
] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, phase, phaseNumber, fileName, status, comments, rejectionReason, version,
  "fileUrl": file.asset->url,
  "submittedBy": submittedBy->{ _id, displayName },
  "reviewedBy": reviewedBy->{ _id, displayName },
  "approvedBy": approvedBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title }
}`;

export const countAllDeliverablesQuery = `count(*[_type == "deliverable"
  && ($status == "" || status == $status)
  && ($phase == "" || phase == $phase)
])`;

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

export const listAllEvaluationsQuery = `*[_type == "evaluation"] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, punctualityScore, qualityScore, serviceScore, finalScore,
  clientFeedback, technicalFeedback,
  "expert": expert->{ _id, displayName },
  "evaluatedBy": evaluatedBy->{ _id, displayName },
  "case": case->{ _id, caseCode, title }
}`;

export const countAllEvaluationsQuery = `count(*[_type == "evaluation"])`;

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

export const listCasePaymentsQuery = `*[_type == "payment" && case._ref == $caseId] | order(paymentNumber asc) {
  _id, _createdAt, paymentNumber, amount, percentage, dueDate, paymentDate, paymentMethod, status, transactionReference, notes,
  "receiptUrl": receiptFile.asset->url,
  "quoteRef": quote->{ _id, version },
  "createdBy": createdBy->{ _id, displayName }
}`;

export const listAllPaymentsQuery = `*[_type == "payment"
  && ($status == "" || status == $status)
] | order(_createdAt desc) [$start...$end] {
  _id, _createdAt, paymentNumber, amount, percentage, dueDate, paymentDate, paymentMethod, status, transactionReference, notes,
  "receiptUrl": receiptFile.asset->url,
  "caseRef": case->{ _id, caseCode, title },
  "quoteRef": quote->{ _id, version },
  "clientName": case->client->name,
  "createdBy": createdBy->{ _id, displayName }
}`;

export const countAllPaymentsQuery = `count(*[_type == "payment" && ($status == "" || status == $status)])`;

export const getPaymentByIdQuery = `*[_type == "payment" && _id == $id][0] {
  _id, _createdAt, paymentNumber, amount, percentage, dueDate, paymentDate, paymentMethod, status, transactionReference, notes,
  "receiptUrl": receiptFile.asset->url,
  "caseRef": case->{ _id, caseCode, title },
  "quoteRef": quote->{ _id, version },
  "clientName": case->client->name,
  "createdBy": createdBy->{ _id, displayName }
}`;

export const listQuotePaymentsQuery = `*[_type == "payment" && quote._ref == $quoteId] | order(paymentNumber asc) {
  _id, _createdAt, paymentNumber, amount, percentage, dueDate, paymentDate, status,
  "receiptUrl": receiptFile.asset->url
}`;

export const listMonthPaymentsQuery = `*[_type == "payment" && dueDate >= $startDate && dueDate < $endDate] | order(dueDate asc) {
  _id, _createdAt, paymentNumber, amount, percentage, dueDate, paymentDate, status,
  "receiptUrl": receiptFile.asset->url,
  "caseRef": case->{ _id, caseCode, title },
  "quoteRef": quote->{ _id, version },
  "clientName": case->client->name
}`;

export const listUpcomingPaymentsQuery = `*[_type == "payment" && status == "pendiente" && dueDate >= $now && dueDate <= $fiveDaysLater] | order(dueDate asc) {
  _id, paymentNumber, amount, dueDate, status,
  "caseRef": case->{ _id, caseCode, title },
  "clientName": case->client->name
}`;

export const listOverduePaymentsQuery = `*[_type == "payment" && status == "pendiente" && dueDate < $now] | order(dueDate asc) {
  _id, paymentNumber, amount, dueDate, status,
  "caseRef": case->{ _id, caseCode, title },
  "clientName": case->client->name
}`;

export const listPaymentsLast12MonthsQuery = `*[_type == "payment" && dueDate >= $twelveMonthsAgo] | order(dueDate asc) {
  _id, amount, dueDate, status
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
  "activeCases": count(*[_type == "case" && status == "gestionado"]),
  "totalClients": count(*[_type == "crmClient"]),
  "totalExperts": count(*[_type == "expert" && validationStatus == "aprobado"]),
  "pendingPayments": count(*[_type == "payment" && status == "pendiente"]),
  "casesByStatus": {
    "creado": count(*[_type == "case" && status == "creado"]),
    "gestionado": count(*[_type == "case" && status == "gestionado"]),
    "cancelado": count(*[_type == "case" && status == "cancelado"])
  },
  "recentCases": *[_type == "case"] | order(_createdAt desc) [0...5] {
    _id, caseCode, title, status, discipline, _createdAt,
    "client": client->{ _id, name }
  },
  "totalRevenue": math::sum(*[_type == "payment" && status == "validado"].amount),
  "pendingActions": count(*[_type == "case" && status == "creado"])
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

export const reportRevenueQuery = `*[_type == "payment" && status == "validado"
  && ($startDate == "" || paymentDate >= $startDate)
  && ($endDate == "" || paymentDate <= $endDate)
] | order(paymentDate desc) {
  _id, amount, paymentDate, paymentMethod,
  "caseRef": case->{ _id, caseCode, title, discipline }
}`;

// ============================================
// ALERT QUERIES
// ============================================

export const casesNeedingHearingAlertQuery = `*[_type == "case"
  && hasHearing != true
  && !(status in ["cancelado"])
] {
  _id, caseCode, title,
  "commercialId": commercial._ref,
  "technicalAnalystId": technicalAnalyst._ref,
  "assignedExpertId": assignedExpert._ref
}`;

export const casesWithUrgentDeadlineQuery = `*[_type == "case"
  && defined(deadlineDate)
  && deadlineDate <= $threshold
  && deadlineDate >= $today
  && !(status in ["cancelado"])
] {
  _id, caseCode, title, deadlineDate,
  "commercialId": commercial._ref,
  "technicalAnalystId": technicalAnalyst._ref,
  "assignedExpertId": assignedExpert._ref
}`;

export const recentHearingAlertTitlesQuery = `*[_type == "notification"
  && title match "Alerta de Audiencia:*"
  && _createdAt >= $since
].title`;

export const recentDeadlineAlertTitlesQuery = `*[_type == "notification"
  && title match "Caso Proximo a Vencer:*"
  && _createdAt >= $since
].title`;

export const listAdminUserIdsQuery = `*[_type == "crmUser"
  && role == "admin"
  && active == true
]._id`;

// ============================================
// WHATSAPP LEADS
// ============================================

export const listWhatsappLeadsQuery = `*[_type == "whatsappLead"
  && ($brand == "" || brand == $brand)
  && ($status == "" || status == $status)
  && ($search == "" || name match $search + "*" || phone match $search + "*" || city match $search + "*")
] | order(lastMessageAt desc) {
  _id, _createdAt, _updatedAt, phone, name, city, motive, brand, status,
  aiCompleted, aiSummary, notes, lastMessageAt, unreadCount,
  "convertedClient": convertedClient->{ _id, name, email },
  "documents": documents[]{ fileName, mimeType, "fileUrl": file.asset->url },
  "lastMessage": *[_type == "whatsappMessage" && lead._ref == ^._id] | order(timestamp desc) [0] {
    content, direction, sender, timestamp
  }
}`;

export const getWhatsappLeadByIdQuery = `*[_type == "whatsappLead" && _id == $id][0] {
  _id, _createdAt, _updatedAt, phone, name, city, motive, brand, status,
  aiCompleted, aiSummary, notes, lastMessageAt, unreadCount,
  "convertedClient": convertedClient->{ _id, name, email },
  "documents": documents[]{ fileName, mimeType, "fileUrl": file.asset->url }
}`;

export const getWhatsappLeadByPhoneQuery = `*[_type == "whatsappLead" && phone == $phone && status != "descartado"] | order(_createdAt desc) [0] {
  _id, _createdAt, phone, name, city, motive, brand, status, aiCompleted
}`;

export const listWhatsappMessagesQuery = `*[_type == "whatsappMessage" && lead._ref == $leadId] | order(timestamp asc) {
  _id, _createdAt, direction, content, sender, agentName, timestamp,
  mediaUrl, mediaType, fileName
}`;

export const countWhatsappLeadsByBrandQuery = `{
  "cnp": count(*[_type == "whatsappLead" && brand == "CNP" && status != "descartado"]),
  "peritus": count(*[_type == "whatsappLead" && brand == "Peritus" && status != "descartado"]),
  "descartados": count(*[_type == "whatsappLead" && status == "descartado"])
}`;
