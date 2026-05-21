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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'application-received': applicationReceived,
  'interview-invite': interviewInvite,
  'next-steps-required': nextStepsRequired,
  'application-not-selected': applicationNotSelected,
  'applicant-portal-invite': applicantPortalInvite,
}

