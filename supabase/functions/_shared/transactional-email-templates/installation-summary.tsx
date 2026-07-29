import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Row, Column, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface InstallItem {
  category?: string
  item_type?: string
  brand_name?: string
  model_number?: string
  serial_number?: string
  labor_warranty_years?: number
  equipment_warranty_years?: number
  spec?: Record<string, string>
  notes?: string
}

interface Props {
  customerName?: string
  companyName?: string
  installDate?: string
  completedBy?: string
  items?: InstallItem[]
  jobNotes?: string
}

const InstallationSummary = ({
  customerName,
  companyName,
  installDate,
  completedBy,
  items = [],
  jobNotes,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Installation Summary{installDate ? ` — ${installDate}` : ''}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Container style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <Heading style={{ fontSize: '22px', color: '#0c2340', margin: '0 0 8px' }}>
          Equipment Installation Summary
        </Heading>
        {installDate && (
          <Text style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px' }}>
            Installed on {installDate}{completedBy ? ` by ${completedBy}` : ''}
          </Text>
        )}
        {customerName && <Text style={text}>Hi {customerName},</Text>}
        <Text style={text}>
          Thank you for choosing {companyName || 'us'}. Below is a summary of the equipment we installed at your location. Please keep this record for warranty and future service.
        </Text>

        {items.map((it, idx) => (
          <Section
            key={idx}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '16px',
              margin: '0 0 14px',
            }}
          >
            <Text style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 4px' }}>
              Item #{idx + 1}
            </Text>
            <Text style={{ fontSize: '15px', fontWeight: 600, color: '#0c2340', margin: '0 0 8px' }}>
              {it.item_type}{it.brand_name ? ` — ${it.brand_name}` : ''}
            </Text>
            <Row>
              <Column style={{ paddingRight: 8, width: '50%' }}>
                <Text style={label}>Model</Text>
                <Text style={value}>{it.model_number || '—'}</Text>
              </Column>
              <Column style={{ paddingLeft: 8, width: '50%' }}>
                <Text style={label}>Serial</Text>
                <Text style={value}>{it.serial_number || '—'}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ paddingRight: 8, width: '50%' }}>
                <Text style={label}>Labor Warranty</Text>
                <Text style={value}>{it.labor_warranty_years ? `${it.labor_warranty_years} year${it.labor_warranty_years > 1 ? 's' : ''}` : '—'}</Text>
              </Column>
              <Column style={{ paddingLeft: 8, width: '50%' }}>
                <Text style={label}>Equipment Warranty</Text>
                <Text style={value}>{it.equipment_warranty_years ? `${it.equipment_warranty_years} year${it.equipment_warranty_years > 1 ? 's' : ''}` : '—'}</Text>
              </Column>
            </Row>
            {it.spec && Object.keys(it.spec).length > 0 && (
              <>
                <Text style={{ ...label, marginTop: 8 }}>Specifications</Text>
                <Text style={value}>
                  {Object.entries(it.spec).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                </Text>
              </>
            )}
            {it.notes && (
              <>
                <Text style={{ ...label, marginTop: 8 }}>Notes</Text>
                <Text style={value}>{it.notes}</Text>
              </>
            )}
          </Section>
        ))}

        {jobNotes && (
          <Section style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b', padding: '12px 16px', margin: '0 0 16px', borderRadius: '4px' }}>
            <Text style={{ fontSize: '11px', textTransform: 'uppercase', color: '#92400e', margin: '0 0 4px' }}>Additional Notes</Text>
            <Text style={{ fontSize: '14px', color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>{jobNotes}</Text>
          </Section>
        )}

        <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
        <Text style={{ fontSize: '14px', color: '#0c2340', fontWeight: 600, margin: '8px 0 0' }}>
          HCS Inc.{companyName ? <><br />{companyName}</> : null}
        </Text>
      </Container>
    </Body>
  </Html>
)

const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#6b7280', margin: '0 0 2px' }
const value = { fontSize: '14px', color: '#111827', margin: '0 0 8px' }

export const template = {
  component: InstallationSummary,
  subject: (data: Record<string, any>) =>
    `Your Installation Summary${data?.installDate ? ` — ${data.installDate}` : ''}`,
  displayName: 'Installation Summary',
  previewData: {
    customerName: 'Jane Doe',
    companyName: 'Best Comfort HVAC',
    installDate: '2026-07-29',
    completedBy: 'John Tech',
    items: [
      {
        category: 'residential_hvac',
        item_type: 'Furnace',
        brand_name: 'Carrier',
        model_number: 'ABC-123',
        serial_number: 'SN00001',
        labor_warranty_years: 2,
        equipment_warranty_years: 10,
        spec: { input_btu: '80000', afue: '96', fuel: 'Natural Gas' },
        notes: 'Upflow configuration.',
      },
    ],
  },
} satisfies TemplateEntry
