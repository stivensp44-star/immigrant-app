import { Applicant } from '../applicantService'
import { evaluateTpsAnswers } from './tpsEvaluation'
import { tpsQuestions } from './tpsQuestions'
import { getMissingRequiredQuestions, InterviewAnswers } from '../interview'

export type TpsFlowProgressState = 'not_started' | 'in_progress' | 'completed'

export type TpsFlowStatus = {
  actionHref: string
  actionLabel: 'Start TPS flow' | 'Resume TPS flow' | 'Review TPS flow'
  lastUpdatedLabel: string | null
  missingRequiredCount: number
  progressState: TpsFlowProgressState
  resultStatus: string | null
}

export function deriveTpsFlowStatus(applicant: Applicant): TpsFlowStatus {
  const answers = normalizeAnswers(applicant.flow_answers.tps)
  const hasAnyAnswers = Object.values(answers).some((value) => value.trim() !== '')
  const missingRequiredQuestions = getMissingRequiredQuestions(tpsQuestions, answers)

  if (!hasAnyAnswers) {
    return {
      actionHref: `/clients/${applicant.id}/flows/tps`,
      actionLabel: 'Start TPS flow',
      lastUpdatedLabel: null,
      missingRequiredCount: tpsQuestions.filter((question) => question.required)
        .length,
      progressState: 'not_started',
      resultStatus: null,
    }
  }

  if (missingRequiredQuestions.length > 0) {
    return {
      actionHref: `/clients/${applicant.id}/flows/tps`,
      actionLabel: 'Resume TPS flow',
      lastUpdatedLabel: null,
      missingRequiredCount: missingRequiredQuestions.length,
      progressState: 'in_progress',
      resultStatus: evaluateTpsAnswers(answers, tpsQuestions).status,
    }
  }

  return {
    actionHref: `/clients/${applicant.id}/flows/tps`,
    actionLabel: 'Review TPS flow',
    lastUpdatedLabel: null,
    missingRequiredCount: 0,
    progressState: 'completed',
    resultStatus: evaluateTpsAnswers(answers, tpsQuestions).status,
  }
}

function normalizeAnswers(value: InterviewAnswers | undefined): InterviewAnswers {
  if (!value) {
    return {}
  }

  return value
}
