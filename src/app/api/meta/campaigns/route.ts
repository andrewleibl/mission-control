import { NextResponse } from 'next/server'
import { getMetaAdsOverview } from '@/data/metaAds'

// Static export for dashboard data (read from file system)
export const dynamic = 'force-static'
export const revalidate = 60 // Revalidate every 60 seconds

export async function GET() {
  const clients = getMetaAdsOverview()
  return NextResponse.json({
    clients,
    updatedAt: new Date().toISOString(),
  })
}
