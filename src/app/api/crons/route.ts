import { NextResponse } from 'next/server'

const GATEWAY = 'http://localhost:18789'
const TOKEN = 'f034d1977a68ee431c961fb370b585f9b6f540d04837d9e5'

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify({ tool: 'cron', args: { action: 'list', includeDisabled: true } })
    })
    const data = await res.json()
    const jobs = data?.result?.details?.jobs ?? []
    return NextResponse.json({ ok: true, jobs })
  } catch (e) {
    return NextResponse.json({ ok: false, jobs: [], error: String(e) })
  }
}
