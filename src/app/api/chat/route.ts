import { NextRequest, NextResponse } from 'next/server'

// Static export - chat returns mock responses
export const dynamic = 'force-static'

export async function GET() {
  return NextResponse.json({ connected: true, mode: 'static' })
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 })
    
    // Static response for build compatibility
    return NextResponse.json({ 
      reply: 'Chat is running in static mode. Use local dev server for live agent chat.' 
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Failed', detail: errorMessage }, { status: 500 })
  }
}
