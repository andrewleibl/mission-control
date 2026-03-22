import ClientDetail from '@/components/ClientDetail'

export default async function MetaAdsClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  return <ClientDetail clientId={clientId} />
}
