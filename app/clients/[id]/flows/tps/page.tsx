import { ClientFlowSession } from '../../../../../components/interview/ClientFlowSession'
import { requireAccessibleApplicant } from '../../../../../lib/applicants/server'
import { requireVendorSession } from '../../../../../lib/auth/server'
import { evaluateTpsAnswers } from '../../../../../lib/flows/tpsEvaluation'
import { tpsQuestions } from '../../../../../lib/flows/tpsQuestions'

export default async function ClientTpsFlowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireVendorSession()
  const { id } = await params
  await requireAccessibleApplicant(id)

  return (
    <ClientFlowSession
      applicantId={id}
      evaluateAnswers={evaluateTpsAnswers}
      flowId="tps"
      questions={tpsQuestions}
      title="TPS Guided Interview"
    />
  )
}
