import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const PARENT_COMPANY = 'Home Comfort Suppliers Inc.'

interface NextStepsProps {
  applicantName?: string
  companyName?: string
  stepTitle?: string
  instructions?: string
  actionUrl?: string
  actionLabel?: string
  dueDate?: string
}

const NextStepsEmail = ({
  applicantName,
  companyName,
  stepTitle,
  instructions,
  actionUrl,
  actionLabel,
  dueDate,
}: NextStepsProps) => {
  const company = companyName || PARENT_COMPANY
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Next steps for your application with {company}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{stepTitle || 'Next Steps Required'}</Heading>

          {applicantName && <Text style={text}>Hi {applicantName},</Text>}

          <Text style={text}>
            Thank you for your continued interest in joining {company}. To move
            your application forward, please complete the next step below.
          </Text>

          {instructions && (
            <Section style={infoBox}>
              <Text style={infoValue}>{instructions}</Text>
            </Section>
          )}

          {dueDate && (
            <Text style={text}>
              <strong>Please complete this by:</strong> {dueDate}
            </Text>
          )}

          {actionUrl && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button href={actionUrl} style={button}>
                {actionLabel || 'Continue'}
              </Button>
            </Section>
          )}

          <Text style={text}>
            Please complete this step in a timely manner so we can keep your
            application moving. If you have any questions, just reply to this
            email.
          </Text>

          <Text style={signature}>
            HCS Inc.<br />
            {company}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NextStepsEmail,
  subject: (data: Record<string, any>) =>
    data?.stepTitle
      ? `${data.stepTitle} — ${data?.companyName || PARENT_COMPANY}`
      : `Next Steps for Your Application — ${data?.companyName || PARENT_COMPANY}`,
  displayName: 'Next Steps Required',
  previewData: {
    applicantName: 'Jane Doe',
    companyName: 'Best Comfort HVAC of Joliet',
    stepTitle: 'Complete Your Background Check Authorization',
    instructions:
      'Please complete and sign the background check authorization form using the link below. This includes driving history (past 5 years) and criminal history review.',
    actionUrl: 'https://example.com/forms/background',
    actionLabel: 'Complete Form',
    dueDate: 'Friday, May 30, 2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c2340', margin: '0 0 20px', lineHeight: '1.3' }
const infoBox = { backgroundColor: '#fff7ed', borderLeft: '4px solid #ea580c', padding: '16px', margin: '0 0 24px', borderRadius: '4px' }
const infoValue = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#0c2340', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' as const }
const signature = { fontSize: '14px', color: '#0c2340', fontWeight: '600' as const, lineHeight: '1.5', margin: '8px 0 0' }
