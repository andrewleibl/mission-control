import type { CreativeRow } from '@/data/metaAds'

export default function CreativeTable({ creatives }: { creatives: CreativeRow[] }) {
  return (
    <div className="card">
      <div style={{ fontSize: 14, fontWeight: 700, color: '#F7FAFC', marginBottom: 16 }}>Top Creative Snapshot</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {['Creative', 'Format', 'Hook', 'Spend', 'CTR', 'CPA'].map((label) => (
                <th
                  key={label}
                  style={{
                    textAlign: 'left',
                    padding: '0 0 12px',
                    fontSize: 11,
                    color: '#4A5568',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {creatives.map((creative) => (
              <tr key={creative.id} style={{ borderBottom: '1px solid #1A1A1A' }}>
                <td style={{ padding: '16px 12px 16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(229,62,62,0.22), rgba(229,62,62,0.05))',
                        border: '1px solid rgba(229,62,62,0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F7FAFC',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {creative.thumb}
                    </div>
                    <div style={{ fontSize: 13, color: '#F7FAFC', fontWeight: 600 }}>{creative.name}</div>
                  </div>
                </td>
                <td style={{ padding: '16px 12px 16px 0', fontSize: 13, color: '#A0AEC0' }}>{creative.format}</td>
                <td style={{ padding: '16px 12px 16px 0', fontSize: 13, color: '#A0AEC0', minWidth: 280 }}>{creative.hook}</td>
                <td style={{ padding: '16px 12px 16px 0', fontSize: 13, color: '#F7FAFC' }}>${creative.spend.toLocaleString()}</td>
                <td style={{ padding: '16px 12px 16px 0', fontSize: 13, color: '#F7FAFC' }}>{creative.ctr.toFixed(1)}%</td>
                <td style={{ padding: '16px 0 16px 0', fontSize: 13, color: '#F7FAFC' }}>${creative.cpa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
