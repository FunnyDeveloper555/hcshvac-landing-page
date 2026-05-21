import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const PARENT_COMPANY = 'Home Comfort Suppliers Inc.'

interface InterviewInviteProps {
  applicantName?: string
  companyName?: string
  positionTitle?: string
  interviewDate?: string
  interviewTime?: string
  interviewLocation?: string
  interviewerName?: string
  schedulingUrl?: string
  notes?: string
}

const InterviewInviteEmail = ({
  applicantName,
  companyName,
  positionTitle,
  interviewDate,
  interviewTime,
  interviewLocation,
  interviewerName,
  schedulingUrl,
  notes,
}: InterviewInviteProps) => {
  const company = companyName || PARENT_COMPANY
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You're invited to interview with {company}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're invited to interview</Heading>

          {applicantName && <Text style={text}>Hi {applicantName},</Text>}

          <Text style={text}>
            Thank you for applying to {company}. After reviewing your
            application{positionTitle ? ` for the ${positionTitle} position` : ''},
            we'd like to invite you to the next step: an interview with our team.
          </Text>

          <Section style={infoBox}>
            {positionTitle && (
              <>
                <Text style={infoLabel}>Position</Text>
                <Text style={infoValue}>{positionTitle}</Text>
              </>
            )}
            {interviewDate && (
              <>
                <Text style={infoLabel}>Date</Text>
                <Text style={infoValue}>{interviewDate}</Text>
              </>
            )}
            {interviewTime && (
              <>
                <Text style={infoLabel}>Time</Text>
                <Text style={infoValue}>{interviewTime}</Text>
              </>
            )}
            {interviewLocation && (
              <>
                <Text style={infoLabel}>Location</Text>
                <Text style={infoValue}>{interviewLocation}</Text>
              </>
            )}
            {interviewerName && (
              <>
                <Text style={infoLabel}>You'll meet with</Text>
                <Text style={infoValue}>{interviewerName}</Text>
              </>
            )}
          </Section>

          {schedulingUrl && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button href={schedulingUrl} style={button}>
                Confirm or Reschedule
              </Button>
            </Section>
          )}

          {notes && <Text style={text}>{notes}</Text>}

          <Text style={text}>
            Please reply to this email if you have any questions or need to
            adjust the timing.
          </Text>

          <Text style={text}>We look forward to meeting you.</Text>
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
  component: InterviewInviteEmail,
  subject: (data: Record<string, any>) =>
    `Interview Invitation — ${data?.companyName || PARENT_COMPANY}`,
  displayName: 'Interview Invitation',
  previewData: {
    applicantName: 'Jane Doe',
    companyName: 'Best Comfort HVAC of Joliet',
    positionTitle: 'HVAC Technician',
    interviewDate: 'Monday, June 2, 2026',
    interviewTime: '10:00 AM CT',
    interviewLocation: '123 Main St, Joliet, IL',
    interviewerName: 'John Smith, Service Manager',
    schedulingUrl: 'https://example.com/schedule',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c2340', margin: '0 0 20px', lineHeight: '1.3' }
const infoBox = { backgroundColor: '#f5f7fa', borderLeft: '4px solid #0c2340', padding: '16px', margin: '0 0 24px', borderRadius: '4px' }
const infoLabel = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: '0.5px', margin: '8px 0 4px' }
const infoValue = { fontSize: '15px', fontWeight: '600' as const, color: '#0c2340', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#0c2340', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' as const }
const signature = { fontSize: '14px', color: '#0c2340', fontWeight: '600' as const, lineHeight: '1.5', margin: '8px 0 0' }
