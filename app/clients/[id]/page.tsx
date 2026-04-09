import { ClientProfileEditor } from '../../../components/ClientProfileEditor'
import { requireAccessibleApplicant } from '../../../lib/applicants/server'
import { requireVendorSession } from '../../../lib/auth/server'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireVendorSession()
  const { id } = await params
  await requireAccessibleApplicant(id)

  return <ClientProfileEditor applicantId={id} />
}
