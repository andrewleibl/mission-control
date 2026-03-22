import ClientDetail from '@/components/ClientDetail'
import { getMetaAdsOverview } from '@/data/metaAds'

export async function generateStaticParams() {
  const clients = getMetaAdsOverview()
  return clients.map((client) => ({
    clientId: client.id,
  }))
}

export default async function MetaAdsClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  return <ClientDetail clientId={clientId} />
}
