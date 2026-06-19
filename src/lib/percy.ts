// Percy chat — client data layer. The UI writes questions into percy_chats and
// polls for the worker's answer; percy_health drives the online/offline dot.

export interface PercyChartPoint { label?: string; day?: string; value: number }
export interface PercyChart { type: string; title: string; points: PercyChartPoint[] }

export type PercyStatus = 'pending' | 'working' | 'answered' | 'error'

export interface PercyChat {
  id: string
  createdAt: number
  question: string
  answer: string | null
  chart: PercyChart | null
  status: PercyStatus
  error: string | null
}

function newId() { return `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToChat(r: any): PercyChat {
  return {
    id: r.id,
    createdAt: r.created_at,
    question: r.question,
    answer: r.answer ?? null,
    chart: r.chart ?? null,
    status: r.status,
    error: r.error ?? null,
  }
}

export async function loadChats(): Promise<PercyChat[]> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { data, error } = await sb.from('percy_chats').select('*').order('created_at', { ascending: true })
  if (error) { console.error('loadChats', error); return [] }
  return (data ?? []).map(rowToChat)
}

// Insert a pending question. The Mac worker picks it up and fills in the answer.
export async function askPercy(question: string): Promise<PercyChat> {
  const chat: PercyChat = {
    id: newId(), createdAt: Date.now(), question,
    answer: null, chart: null, status: 'pending', error: null,
  }
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('percy_chats').insert({
    id: chat.id, created_at: chat.createdAt, question, status: 'pending',
  })
  if (error) throw error
  return chat
}

export async function getChat(id: string): Promise<PercyChat | null> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { data } = await sb.from('percy_chats').select('*').eq('id', id).maybeSingle()
  return data ? rowToChat(data) : null
}

// Worker heartbeats every ~30s; treat >90s of silence as offline.
export async function percyOnline(): Promise<boolean> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { data } = await sb.from('percy_health').select('last_beat_at').eq('id', 'worker').maybeSingle()
  if (!data) return false
  return Date.now() - Number(data.last_beat_at) < 90_000
}
