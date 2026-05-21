import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const PARENT_COMPANY = 'Home Comfort Suppliers Inc.'

interface ApplicationReceivedProps {
  applicantName?: string
  companyName?: string
}

const ApplicationReceivedEmail = ({
  applicantName,
  companyName,
}: ApplicationReceivedProps) => {
  const company = companyName || PARENT_COMPANY
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Thank you for your interest in {PARENT_COMPANY}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Thank you for your interest in {PARENT_COMPANY}
          </Heading>

          <Section style={infoBox}>
            <Text style={infoLabel}>Company Name</Text>
            <Text style={infoValue}>{company}</Text>
          </Section>

          {applicantName && (
            <Text style={text}>Hi {applicantName},</Text>
          )}

          <Text style={text}>
            We have received your application and resume and will contact you
            after we review the documentation provided and confirm that it is a
            successful fit for our needs.
          </Text>

          <Text style={text}>
            Please be sure to follow the next steps provided in a timely manner
            if and when they are provided.
          </Text>

          <Text style={text}>Thank you,</Text>
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
  component: ApplicationReceivedEmail,
  subject: (data: Record<string, any>) =>
    `Application Received — ${data?.companyName || PARENT_COMPANY}`,
  displayName: 'Application Received',
  previewData: {
    applicantName: 'Jane Doe',
    companyName: 'Best Comfort HVAC of Joliet',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 24px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#0c2340',
  margin: '0 0 20px',
  lineHeight: '1.3',
}
const infoBox = {
  backgroundColor: '#f5f7fa',
  borderLeft: '4px solid #0c2340',
  padding: '12px 16px',
  margin: '0 0 24px',
  borderRadius: '4px',
}
const infoLabel = {
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  letterSpacing: '0.5px',
  margin: '0 0 4px',
}
const infoValue = {
  fontSize: '15px',
  fontWeight: '600' as const,
  color: '#0c2340',
  margin: '0',
}
const text = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const signature = {
  fontSize: '14px',
  color: '#0c2340',
  fontWeight: '600' as const,
  lineHeight: '1.5',
  margin: '8px 0 0',
}
