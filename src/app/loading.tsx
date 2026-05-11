import { PageContainer, colors } from '@/components/DesignSystem'

export default function Loading() {
  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.textMuted, fontSize: 13, padding: '8px 0' }}>
        <span style={{
          display: 'inline-block',
          width: 14,
          height: 14,
          border: `2px solid ${colors.border}`,
          borderTopColor: colors.accent,
          borderRadius: '50%',
          animation: 'mc-spin 0.7s linear infinite',
        }} />
        <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loading…</span>
      </div>
      <style>{`@keyframes mc-spin { to { transform: rotate(360deg); } }`}</style>
    </PageContainer>
  )
}
