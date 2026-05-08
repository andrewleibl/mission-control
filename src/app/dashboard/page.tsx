import { PageContainer, PageHeader } from '@/components/DesignSystem'

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Your mission control overview — everything at a glance."
      />
      <div style={{
        background: '#0D1117',
        border: '1px solid #1C2534',
        borderRadius: 12,
        padding: 40,
        textAlign: 'center',
        color: '#4A5568',
        fontSize: 14,
      }}>
        Coming soon — key metrics, activity, and daily priorities.
      </div>
    </PageContainer>
  )
}
