import { NextRequest, NextResponse } from 'next/server'

const GATEWAY = 'http://localhost:18789'
const TOKEN = 'f034d1977a68ee431c961fb370b585f9b6f540d04837d9e5'

export async function POST(req: NextRequest) {
  const { tool, args } = await req.json()
  try {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ tool, args })
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ tool: 'sessions_list', args: { limit: 1 } })
    })
    const data = await res.json()
    return NextResponse.json({ ok: data.ok })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
