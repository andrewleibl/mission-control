type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return [{ slug: 'demo-client' }]
}

export default async function PipelineClientPage({ params }: Props) {
  const { slug } = await params

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f7fafc' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px 44px' }}>
        <header style={{ marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e53e3e', fontWeight: 700 }}>
            Client Pipeline Portal
          </p>
          <h1 style={{ margin: '8px 0 6px', fontSize: 30, lineHeight: 1.1 }}>Client View Stub</h1>
          <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>
            Phase 1.7 slug route scaffold: <span style={{ color: '#e2e8f0' }}>/pipeline/{slug}</span>
          </p>
        </header>

        <section style={{ border: '1px solid #1f1f1f', borderRadius: 12, background: 'linear-gradient(180deg,#141414,#101010)', padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Access Context</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Slug recognized: <span style={{ color: '#e2e8f0' }}>{slug}</span></div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>PIN/authorization layer will be added in security phase.</div>
        </section>

        <section style={{ border: '1px dashed #2a2a2a', borderRadius: 12, padding: 18, color: '#94a3b8', fontSize: 13 }}>
          Client-facing Hot/Warm/Cold portal shell goes here in Phase 2 wiring.
        </section>
      </div>
    </div>
  )
}
