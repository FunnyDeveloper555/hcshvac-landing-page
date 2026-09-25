import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  kind?: string
  number?: string
  title?: string
  when?: string
  forWho?: string
  location?: string
  publicNotes?: string
  privateNotes?: string
  employeeName?: string
}

const text = { fontSize: '14px', color: '#1f2937', lineHeight: '22px', margin: '0 0 8px' }

const WorkItemAssigned = (p: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${p.kind || 'Task'} ${p.number || ''}: ${p.title || ''}`}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
        <Heading style={{ fontSize: '20px', color: '#0c2340', margin: '0 0 12px' }}>
          {p.kind || 'Task'} {p.number}: {p.title}
        </Heading>
        {p.employeeName && <Text style={text}>Hi {p.employeeName}, this was assigned to you.</Text>}
        {p.when && <Text style={text}><b>When:</b> {p.when}</Text>}
        {p.forWho && <Text style={text}><b>For:</b> {p.forWho}</Text>}
        {p.location && <Text style={text}><b>Location:</b> {p.location}</Text>}
        {p.publicNotes && <Text style={text}><b>Public notes:</b> {p.publicNotes}</Text>}
        {p.privateNotes && <Text style={text}><b>Private notes:</b> {p.privateNotes}</Text>}
        <Text style={{ ...text, color: '#6b7280', fontSize: '12px' }}>Open the Tickets &amp; Tasks board to reply.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WorkItemAssigned,
  subject: (d: Record<string, any>) => `${d.kind || 'Task'} ${d.number || ''}: ${d.title || ''}`.trim(),
  displayName: 'Ticket / task assigned',
  previewData: { kind: 'Task', number: 'BCJ-TSK260001', title: 'Pick up condenser', when: 'Fri, Sep 25', employeeName: 'Jimmy' },
} satisfies TemplateEntry
