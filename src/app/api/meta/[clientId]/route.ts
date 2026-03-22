import { NextResponse } from 'next/server'
import { getMetaAdsClient } from '@/data/metaAds'

// Static export - data from file system
export const dynamic = 'force-static'
export const revalidate = 60

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const client = getMetaAdsClient(clientId)

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json(client)
}
