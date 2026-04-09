import { InterviewFlow } from '../../../components/interview/InterviewFlow'
import { requireVendorSession } from '../../../lib/auth/server'
import { tpsQuestions } from '../../../lib/flows/tpsQuestions'

export default async function TpsFlowPage() {
  await requireVendorSession()

  return (
    <InterviewFlow
      questions={tpsQuestions}
      title="TPS Guided Interview"
    />
  )
}
