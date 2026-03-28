/**
 * Update Mission Control API routes to use live Apollo data
 */

const fs = require('fs');
const path = require('path');

const MISSION_CONTROL_DIR = path.join(process.env.HOME, '.openclaw', 'workspace', 'builds', 'mission-control');

// New API route content using live data
const campaignsRouteTs = `import { NextResponse } from 'next/server'
import { getAllClientsOverview } from '@/lib/apollo-data'

export async function GET() {
  try {
    const clients = await getAllClientsOverview()
    return NextResponse.json({
      clients,
      updatedAt: new Date().toISOString(),
      source: 'live'
    })
  } catch (error) {
    console.error('Meta API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Meta Ads data', details: error.message },
      { status: 500 }
    )
  }
}
`;

const clientDetailRouteTs = `import { NextResponse } from 'next/server'
import { fetchLiveClientData } from '@/lib/apollo-data'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const client = await fetchLiveClientData(clientId)

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Meta API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client data', details: error.message },
      { status: 500 }
    )
  }
}
`;

const apolloDataTs = `/**
 * Apollo Data Connector
 * Fetches live Meta Ads data for Mission Control
 */

const META_API_URL = process.env.META_API_URL || 'http://localhost:3001/api'

export async function getAllClientsOverview() {
  const response = await fetch(\`\${META_API_URL}/clients\`, {
    headers: { 'Content-Type': 'application/json' }
  })
  
  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`)
  }
  
  const data = await response.json()
  return data.clients
}

export async function fetchLiveClientData(clientId: string) {
  const response = await fetch(\`\${META_API_URL}/clients/\${clientId}\`, {
    headers: { 'Content-Type': 'application/json' }
  })
  
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(\`API error: \${response.status}\`)
  }
  
  return response.json()
}
`;

// Write files
const apiDir = path.join(MISSION_CONTROL_DIR, 'src', 'app', 'api', 'meta');
const libDir = path.join(MISSION_CONTROL_DIR, 'src', 'lib');

// Update campaigns route
fs.writeFileSync(path.join(apiDir, 'campaigns', 'route.ts'), campaignsRouteTs);

// Update client detail route
fs.writeFileSync(path.join(apiDir, '[clientId]', 'route.ts'), clientDetailRouteTs);

// Create Apollo data connector
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}
fs.writeFileSync(path.join(libDir, 'apollo-data.ts'), apolloDataTs);

console.log('✅ Mission Control API routes updated');
console.log('📁 Files updated:');
console.log('  - src/app/api/meta/campaigns/route.ts');
console.log('  - src/app/api/meta/[clientId]/route.ts');
console.log('  - src/lib/apollo-data.ts (new)');
`;

// Run the updater
require('./update-mission-control-api.js');
