export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { getLeads } from '@/lib/lead-storage'
import { getCurrentUser } from '@/lib/auth'

// Track connected clients with their state
type Client = {
  controller: ReadableStreamDefaultController
  active: boolean
}

const clients = new Set<Client>()

// Broadcast to all connected clients
export function broadcastLeadsUpdate(leads: any[]) {
  const data = JSON.stringify({ type: 'leads', data: leads, timestamp: Date.now() })
  const message = `data: ${data}\n\n`
  
  clients.forEach(client => {
    if (!client.active) {
      clients.delete(client)
      return
    }
    try {
      client.controller.enqueue(new TextEncoder().encode(message))
    } catch (e) {
      client.active = false
      clients.delete(client)
    }
  })
}

export async function GET(request: NextRequest) {
  // Verify user is authenticated
  const user = await getCurrentUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let clientObj: Client | null = null
  let heartbeatInterval: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      clientObj = { controller, active: true }
      clients.add(clientObj)
      
      // Send initial heartbeat
      try {
        const heartbeat = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`
        controller.enqueue(new TextEncoder().encode(heartbeat))
      } catch (e) {
        clientObj.active = false
        clients.delete(clientObj)
        return
      }
      
      // Send current leads immediately
      getLeads().then(leads => {
        if (!clientObj?.active) return
        try {
          const data = JSON.stringify({ type: 'leads', data: leads, timestamp: Date.now() })
          const message = `data: ${data}\n\n`
          controller.enqueue(new TextEncoder().encode(message))
        } catch (e) {
          if (clientObj) {
            clientObj.active = false
            clients.delete(clientObj)
          }
        }
      }).catch(() => {
        if (clientObj) {
          clientObj.active = false
          clients.delete(clientObj)
        }
      })
      
      // Keep-alive heartbeat every 30 seconds
      heartbeatInterval = setInterval(() => {
        if (!clientObj?.active) {
          if (heartbeatInterval) clearInterval(heartbeatInterval)
          return
        }
        try {
          const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
          controller.enqueue(new TextEncoder().encode(heartbeat))
        } catch (e) {
          if (clientObj) {
            clientObj.active = false
            clients.delete(clientObj)
          }
          if (heartbeatInterval) clearInterval(heartbeatInterval)
        }
      }, 30000)
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval)
        if (clientObj) {
          clientObj.active = false
          clients.delete(clientObj)
        }
      })
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      if (clientObj) {
        clientObj.active = false
        clients.delete(clientObj)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
