import { InterviewFlow } from '../../../components/interview/InterviewFlow'
import { tpsQuestions } from '../../../lib/flows/tpsQuestions'

export default function TpsFlowPage() {
  return (
    <InterviewFlow
      questions={tpsQuestions}
      title="TPS Guided Interview"
    />
  )
}
