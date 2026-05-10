'use server'

import { JWTPayload, UserRole } from '@/lib/auth'
import { promises as fs } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const USERS_FILE = join(DATA_DIR, 'users.json')
const CLIENTS_FILE = join(DATA_DIR, 'clients.json')

export type Client = {
  id: string
  name: string
  subdomain: string
  ghlApiKey?: string
  facebookFormId?: string
  pin?: string // Access PIN for client
  isActive: boolean
  createdAt: string
}

export type User = {
  id: string
  email: string
  passwordHash: string
  role: UserRole
  clientId?: string
  subdomain?: string
  createdAt: string
  updatedAt: string
}

// Initialize files
async function initFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch { /* ignore */ }
  
  try {
    await fs.access(USERS_FILE)
  } catch {
    // Create default admin user
    const defaultAdmin: User = {
      id: 'admin-001',
      email: 'andrew@straightpointmarketing.com',
      passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // "password"
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    // Create Ricardo client user
    const ricardoUser: User = {
      id: 'user-ricardo-001',
      email: 'ricardo@maderalandscape.com',
      passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // "password"
      role: 'client',
      clientId: 'client-001',
      subdomain: 'ricardo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await fs.writeFile(USERS_FILE, JSON.stringify([defaultAdmin, ricardoUser], null, 2))
  }
  
  try {
    await fs.access(CLIENTS_FILE)
  } catch {
    // Create Ricardo as default client
    const ricardo: Client = {
      id: 'client-001',
      name: 'Ricardo Madera',
      subdomain: 'ricardo',
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    await fs.writeFile(CLIENTS_FILE, JSON.stringify([ricardo], null, 2))
  }
}

// Get all users
export async function getUsers(): Promise<User[]> {
  await initFiles()
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.id === id) || null
}

// Save user (create or update)
export async function saveUser(user: User): Promise<void> {
  await initFiles()
  const users = await getUsers()
  
  const existingIndex = users.findIndex(u => u.id === user.id)
  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }
  
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

// Get all clients
export async function getClients(): Promise<Client[]> {
  await initFiles()
  try {
    const data = await fs.readFile(CLIENTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Get client by subdomain
export async function getClientBySubdomain(subdomain: string): Promise<Client | null> {
  const clients = await getClients()
  return clients.find(c => c.subdomain.toLowerCase() === subdomain.toLowerCase()) || null
}

// Get client by ID
export async function getClientById(id: string): Promise<Client | null> {
  const clients = await getClients()
  return clients.find(c => c.id === id) || null
}

// Save client
export async function saveClient(client: Client): Promise<void> {
  await initFiles()
  const clients = await getClients()
  
  const existingIndex = clients.findIndex(c => c.id === client.id)
  if (existingIndex >= 0) {
    clients[existingIndex] = client
  } else {
    clients.push(client)
  }
  
  await fs.writeFile(CLIENTS_FILE, JSON.stringify(clients, null, 2))
}

// Generate unique ID
export async function generateId(prefix: string): Promise<string> {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Hash password (re-export from auth for convenience)
export async function hashPassword(password: string): Promise<string> {
  const { hashPassword: authHash } = await import('@/lib/auth')
  return authHash(password)
}
