import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  // Health check — verify gateway is reachable
  try {
    await execAsync('openclaw gateway health', { timeout: 5000 })
    return NextResponse.json({ connected: true })
  } catch {
    return NextResponse.json({ connected: false }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 })

    // Escape the message for shell safety
    const escaped = message.replace(/'/g, `'\\''`)

    const { stdout } = await execAsync(
      `openclaw agent --message '${escaped}' --expect-final`,
      { timeout: 60000 }
    )

    return NextResponse.json({ reply: stdout.trim() })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('Chat error:', errorMessage)
    return NextResponse.json({ error: 'Agent call failed', detail: errorMessage }, { status: 500 })
  }
}
