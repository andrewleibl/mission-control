'use client'
import { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "🔱 Poseidon online. What do you need, Andrew?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('http://localhost:4200/api/message', { method: 'HEAD' })
      .then(() => setConnected(true))
      .catch(() => setConnected(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:4200/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionKey: 'agent:main:main',
          message: userMsg.content
        })
      })
      const data = await res.json()
      const reply = data?.reply || data?.message || data?.content || JSON.stringify(data)
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date()
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Could not reach OpenClaw. Make sure the Gateway is running on port 4200.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#F7FAFC' }}>Chat</h1>
          <p style={{ fontSize: 13, color: '#718096', marginTop: 2, margin: 0 }}>Direct line to Poseidon</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected === null ? '#ECC94B' : connected ? '#48BB78' : '#FC8181',
            boxShadow: connected === null ? '0 0 0 2px rgba(236,201,75,0.2)' :
              connected ? '0 0 0 2px rgba(72,187,120,0.2)' : '0 0 0 2px rgba(229,62,62,0.2)'
          }} />
          <span style={{ fontSize: 12, color: '#718096' }}>
            {connected === null ? 'Checking...' : connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', background: '#0D0D0D',
        borderRadius: 12, border: '1px solid #1A1A1A',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 10
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: 'rgba(229,62,62,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0, alignSelf: 'flex-end'
              }}>🔱</div>
            )}
            <div style={{
              maxWidth: '72%',
              background: msg.role === 'user' ? '#E53E3E' : '#1A1A1A',
              color: '#F7FAFC',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
              <div style={{ fontSize: 10, color: msg.role === 'user' ? 'rgba(255,255,255,0.5)' : '#4A5568', marginTop: 4 }}>
                {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: 'rgba(229,62,62,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>🔱</div>
            <div style={{ background: '#1A1A1A', padding: '10px 14px', borderRadius: '12px 12px 12px 4px' }}>
              <span style={{ color: '#4A5568', fontSize: 18, letterSpacing: 4 }}>···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message Poseidon... (Enter to send)"
          rows={2}
          style={{ flex: 1, resize: 'none' }}
        />
        <button
          className="btn-primary"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ alignSelf: 'flex-end', opacity: loading || !input.trim() ? 0.5 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
