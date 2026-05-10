'use server'

import { Lead, WebhookLog } from '@/types/lead'
import { promises as fs } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const LEADS_FILE = join(DATA_DIR, 'leads.json')
const LOGS_FILE = join(DATA_DIR, 'webhook-logs.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {
    // Directory already exists
  }
}

// Initialize files if they don't exist
async function initFiles() {
  await ensureDataDir()
  
  try {
    await fs.access(LEADS_FILE)
  } catch {
    await fs.writeFile(LEADS_FILE, JSON.stringify([], null, 2))
  }
  
  try {
    await fs.access(LOGS_FILE)
  } catch {
    await fs.writeFile(LOGS_FILE, JSON.stringify([], null, 2))
  }
}

// Get all leads
export async function getLeads(): Promise<Lead[]> {
  await initFiles()
  try {
    const data = await fs.readFile(LEADS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Get lead by ID
export async function getLeadById(id: string): Promise<Lead | null> {
  const leads = await getLeads()
  return leads.find(lead => lead.id === id) || null
}

// Save a lead (create or update)
export async function saveLead(lead: Lead): Promise<void> {
  await initFiles()
  const leads = await getLeads()
  
  const existingIndex = leads.findIndex(l => l.id === lead.id)
  if (existingIndex >= 0) {
    leads[existingIndex] = lead
  } else {
    leads.push(lead)
  }
  
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2))
}

// Delete a lead
export async function deleteLead(id: string): Promise<void> {
  await initFiles()
  const leads = await getLeads()
  const filtered = leads.filter(lead => lead.id !== id)
  await fs.writeFile(LEADS_FILE, JSON.stringify(filtered, null, 2))
}

// Get all webhook logs
export async function getWebhookLogs(): Promise<WebhookLog[]> {
  await initFiles()
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Add webhook log entry
export async function addWebhookLog(log: WebhookLog): Promise<void> {
  await initFiles()
  const logs = await getWebhookLogs()
  logs.unshift(log) // Add to beginning
  
  // Keep only last 100 logs
  const trimmed = logs.slice(0, 100)
  await fs.writeFile(LOGS_FILE, JSON.stringify(trimmed, null, 2))
}

// Clear all webhook logs
export async function clearWebhookLogs(): Promise<void> {
  await initFiles()
  await fs.writeFile(LOGS_FILE, JSON.stringify([], null, 2))
}

// Get leads by status
export async function getLeadsByStatus(status: Lead['status']): Promise<Lead[]> {
  const leads = await getLeads()
  return leads.filter(lead => lead.status === status)
}

// Get lead stats
export async function getLeadStats() {
  const leads = await getLeads()
  return {
    total: leads.length,
    hot: leads.filter(l => l.status === 'Hot').length,
    warm: leads.filter(l => l.status === 'Warm').length,
    cold: leads.filter(l => l.status === 'Cold').length,
    averageScore: leads.length > 0 
      ? leads.reduce((sum, l) => sum + l.score, 0) / leads.length 
      : 0
  }
}
