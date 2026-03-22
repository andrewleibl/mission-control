import { NextResponse } from 'next/server'

// Live data from Apollo (via file system for now)
const getMetaAdsOverview = async () => {
  try {
    // Read from Apollo's data store
    const fs = require('fs')
    const path = require('path')
    const dataPath = path.join(process.env.HOME || '', '.openclaw', 'workspace', 'meta-ads', 'data', 'live-clients.json')
    
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
      return data.clients || []
    }
  } catch (e) {
    console.log('Live data not available, using mock')
  }
  
  // Fallback to mock data
  const { getMetaAdsOverview: mock } = await import('@/data/metaAds')
  return mock()
}

export async function GET() {
  const clients = await getMetaAdsOverview()
  return NextResponse.json({
    clients,
    updatedAt: new Date().toISOString(),
  })
}
