/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as applicationReceived } from './application-received.tsx'
import { template as interviewInvite } from './interview-invite.tsx'
import { template as nextStepsRequired } from './next-steps-required.tsx'
import { template as applicationNotSelected } from './application-not-selected.tsx'
import { template as applicantPortalInvite } from './applicant-portal-invite.tsx'
import { template as hireApplicationInvite } from './hire-application-invite.tsx'
import { template as bookingInvite } from './booking-invite.tsx'
import { template as appointmentConfirmation } from './appointment-confirmation.tsx'
import { template as customerRegistrationInvite } from './customer-registration-invite.tsx'
import { template as siteProfileReport } from './site-profile-report.tsx'
import { template as installationSummary } from './installation-summary.tsx'
import { template as workItemAssigned } from './work-item-assigned.tsx'
import { template as bookingReceived } from './booking-received.tsx'
import { template as vendorRfq } from './vendor-rfq.tsx'
import { template as bookingSubmissionAlert } from './booking-submission-alert.tsx'
import { template as chatUnrepliedAlert } from './chat-unreplied-alert.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'application-received': applicationReceived,
  'interview-invite': interviewInvite,
  'next-steps-required': nextStepsRequired,
  'application-not-selected': applicationNotSelected,
  'applicant-portal-invite': applicantPortalInvite,
  'hire-application-invite': hireApplicationInvite,
  'booking-invite': bookingInvite,
  'appointment-confirmation': appointmentConfirmation,
  'customer-registration-invite': customerRegistrationInvite,
  'site-profile-report': siteProfileReport,
  'installation-summary': installationSummary,
  'work-item-assigned': workItemAssigned,
  'booking-received': bookingReceived,
  'vendor-rfq': vendorRfq,
  'booking-submission-alert': bookingSubmissionAlert,
  'chat-unreplied-alert': chatUnrepliedAlert,
}

