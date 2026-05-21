import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const PARENT_COMPANY = 'Home Comfort Suppliers Inc.'

interface NotSelectedProps {
  applicantName?: string
  companyName?: string
  positionTitle?: string
}

const NotSelectedEmail = ({
  applicantName,
  companyName,
  positionTitle,
}: NotSelectedProps) => {
  const company = companyName || PARENT_COMPANY
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>An update on your application with {company}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>An update on your application</Heading>

          {applicantName && <Text style={text}>Hi {applicantName},</Text>}

          <Text style={text}>
            Thank you for your interest in {company}
            {positionTitle ? ` and for applying for the ${positionTitle} position` : ''}.
            We truly appreciate the time and effort you put into your
            application.
          </Text>

          <Text style={text}>
            After carefully reviewing your background and qualifications against
            our current needs, we have decided to move forward with other
            candidates at this time.
          </Text>

          <Text style={text}>
            This was not an easy decision. We'll keep your information on file
            and encourage you to apply again as new opportunities open up that
            match your experience.
          </Text>

          <Text style={text}>
            We wish you the best in your job search and future career.
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
  component: NotSelectedEmail,
  subject: (data: Record<string, any>) =>
    `An Update on Your Application — ${data?.companyName || PARENT_COMPANY}`,
  displayName: 'Application Not Selected',
  previewData: {
    applicantName: 'Jane Doe',
    companyName: 'Best Comfort HVAC of Joliet',
    positionTitle: 'HVAC Technician',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c2340', margin: '0 0 20px', lineHeight: '1.3' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const signature = { fontSize: '14px', color: '#0c2340', fontWeight: '600' as const, lineHeight: '1.5', margin: '8px 0 0' }
