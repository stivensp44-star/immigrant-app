import {
  FlowEvaluationResult,
  InterviewAnswers,
  Question,
  getVisibleQuestions,
} from '../interview'

const TPS_DESIGNATED_COUNTRIES = new Set([
  'el salvador',
  'haiti',
  'honduras',
  'myanmar',
  'nepal',
  'nicaragua',
  'somalia',
  'south sudan',
  'sudan',
  'syria',
  'ukraine',
  'venezuela',
  'yemen',
])

const TPS_ENTRY_CUTOFF = '2024-06-24'

export function evaluateTpsAnswers(
  answers: InterviewAnswers,
  questions: Question[]
): FlowEvaluationResult {
  const visibleQuestions = getVisibleQuestions(questions, answers)
  const missingRequiredAnswers = visibleQuestions
    .filter((question) => question.required)
    .filter((question) => !(answers[question.id] ?? '').trim())
    .map((question) => question.label)

  const reviewAreas: string[] = []
  const issueAreas: string[] = []

  const citizenship = normalizeText(answers.country_of_citizenship)
  if (!citizenship) {
    reviewAreas.push('Country of citizenship is missing.')
  } else if (!TPS_DESIGNATED_COUNTRIES.has(citizenship)) {
    issueAreas.push(
      'The stated country of citizenship is not in the current TPS reference list used by this MVP.'
    )
  }

  const entryDate = answers.entry_date_us ?? ''
  if (!entryDate) {
    reviewAreas.push('Entry date to the United States is missing.')
  } else if (entryDate > TPS_ENTRY_CUTOFF) {
    issueAreas.push(
      `The recorded entry date is after the conservative TPS cutoff used here (${TPS_ENTRY_CUTOFF}).`
    )
  }

  if ((answers.continuous_presence ?? '') === 'no') {
    issueAreas.push(
      'The client reported a possible break in continuous physical presence.'
    )
  }

  if ((answers.arrest_history ?? '') === 'yes') {
    issueAreas.push('The client reported arrest, charge, or conviction history.')
  }

  const currentStatus = answers.current_status ?? ''
  if (!currentStatus) {
    reviewAreas.push('Current immigration status is missing.')
  } else if (currentStatus === 'other') {
    reviewAreas.push(
      'Current immigration status was marked as "Other" and needs attorney or case review.'
    )
  }

  if (missingRequiredAnswers.length > 0) {
    reviewAreas.push(
      `Required answers still missing: ${missingRequiredAnswers.join(', ')}.`
    )
  }

  if (issueAreas.length > 0) {
    return {
      status: 'Potential issue identified',
      explanation:
        'This interview found one or more answers that may affect TPS eligibility and should be reviewed carefully. This is a conservative screening result, not legal advice.',
      missingOrRiskyAreas: [...issueAreas, ...reviewAreas],
    }
  }

  if (reviewAreas.length > 0) {
    return {
      status: 'Needs review',
      explanation:
        'The interview does not show a clear blocker, but some answers are missing, unclear, or need manual review before drawing conclusions.',
      missingOrRiskyAreas: reviewAreas,
    }
  }

  return {
    status: 'Likely eligible',
    explanation:
      'Based on this limited rule set, the answers do not show an obvious TPS issue. This is only a preliminary screening result and not legal advice.',
    missingOrRiskyAreas: [],
  }
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}
