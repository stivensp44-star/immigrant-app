import { ClientFlowSession } from '../../../../../components/interview/ClientFlowSession'
import { tpsQuestions } from '../../../../../lib/flows/tpsQuestions'

export default async function ClientTpsFlowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <ClientFlowSession
      applicantId={id}
      flowId="tps"
      questions={tpsQuestions}
      title="TPS Guided Interview"
    />
  )
}
