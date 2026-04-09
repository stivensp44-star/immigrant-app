import { ApplicantDashboard } from '../components/ApplicantDashboard'
import { requireVendorSession } from '../lib/auth/server'

export default async function Home() {
  await requireVendorSession()

  return <ApplicantDashboard />
}
