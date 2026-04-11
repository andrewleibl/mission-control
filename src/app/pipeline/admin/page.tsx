export default function PipelineAdminPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f7fafc' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px 44px' }}>
        <header style={{ marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e53e3e', fontWeight: 700 }}>
            Pipeline Admin
          </p>
          <h1 style={{ margin: '8px 0 6px', fontSize: 30, lineHeight: 1.1 }}>Admin Control Stub</h1>
          <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>
            Phase 1.7 stub for internal management controls before real wiring.
          </p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginBottom: 14 }}>
          {['Client Slug Manager', 'Routing Rules', 'Pipeline Health', 'Override Queue'].map((title) => (
            <div key={title} style={{ border: '1px solid #1f1f1f', borderRadius: 12, background: 'linear-gradient(180deg,#141414,#101010)', padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>UI placeholder — wiring in Phase 2/3.</div>
            </div>
          ))}
        </section>

        <section style={{ border: '1px solid #1f1f1f', borderRadius: 12, background: 'linear-gradient(180deg,#141414,#101010)', padding: 14 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, letterSpacing: '0.02em' }}>Checkpoint 1.7 (Admin Stub)</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>Created /pipeline/admin route</li>
            <li style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>Defined management panel placeholders</li>
            <li style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>Prepared internal control surface for Phase 2</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
