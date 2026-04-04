import { ClientProfileEditor } from '../../../components/ClientProfileEditor'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ClientProfileEditor applicantId={id} />
}
