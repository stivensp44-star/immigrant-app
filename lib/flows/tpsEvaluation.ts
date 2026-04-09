import {
  FlowEvaluationResult,
  InterviewAnswers,
  Question,
  getMissingRequiredQuestions,
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
  const missingRequiredItems = getMissingRequiredQuestions(questions, answers).map(
    (question) => question.label
  )

  const reasons: string[] = []
  const reviewAreas: string[] = []
  const issueAreas: string[] = []

  const citizenship = normalizeText(answers.country_of_citizenship)
  if (!citizenship) {
    reviewAreas.push('Country of citizenship is missing.')
  } else if (!TPS_DESIGNATED_COUNTRIES.has(citizenship)) {
    issueAreas.push(
      'The stated country of citizenship is not in the current TPS reference list used by this MVP.'
    )
  } else {
    reasons.push(
      'The stated country of citizenship matches the conservative TPS country reference list used by this screening.'
    )
  }

  const entryDate = answers.entry_date_us ?? ''
  if (!entryDate) {
    reviewAreas.push('Entry date to the United States is missing.')
  } else if (entryDate > TPS_ENTRY_CUTOFF) {
    issueAreas.push(
      `The recorded entry date is after the conservative TPS cutoff used here (${TPS_ENTRY_CUTOFF}).`
    )
  } else {
    reasons.push(
      `The recorded entry date is on or before the conservative TPS cutoff used here (${TPS_ENTRY_CUTOFF}).`
    )
  }

  if ((answers.continuous_presence ?? '') === 'no') {
    issueAreas.push(
      'The client reported a possible break in continuous physical presence.'
    )
  } else if ((answers.continuous_presence ?? '') === 'yes') {
    reasons.push(
      'The client reported continuous physical presence in the United States.'
    )
  }

  if ((answers.arrest_history ?? '') === 'yes') {
    issueAreas.push('The client reported arrest, charge, or conviction history.')
  } else if ((answers.arrest_history ?? '') === 'no') {
    reasons.push(
      'The client did not report arrest, charge, or conviction history in this interview.'
    )
  }

  const currentStatus = answers.current_status ?? ''
  if (!currentStatus) {
    reviewAreas.push('Current immigration status is missing.')
  } else if (currentStatus === 'other') {
    reviewAreas.push(
      'Current immigration status was marked as "Other" and needs attorney or case review.'
    )
  } else {
    reasons.push('The client selected a current immigration status value.')
  }

  if (issueAreas.length > 0) {
    return {
      status: 'Potential issue identified',
      explanation:
        'This interview found one or more answers that may affect TPS eligibility and should be reviewed carefully. This is a conservative screening result, not legal advice.',
      missingRequiredItems,
      readinessNote:
        missingRequiredItems.length > 0
          ? 'The interview still needs required answers before it is ready for full internal review.'
          : 'The interview appears complete enough for issue-focused internal review.',
      reasons,
      recommendedNextStep:
        'Review the flagged issue items, confirm the facts with the client, and have a qualified reviewer assess TPS eligibility.',
      warningItems: [...issueAreas, ...reviewAreas],
    }
  }

  if (reviewAreas.length > 0 || missingRequiredItems.length > 0) {
    return {
      status: 'Needs review',
      explanation:
        'The interview does not show a clear blocker, but some answers are missing, unclear, or need manual review before drawing conclusions.',
      missingRequiredItems,
      readinessNote:
        missingRequiredItems.length > 0
          ? 'The interview is not yet complete because required answers are still missing.'
          : 'The interview appears mostly complete but still needs manual review.',
      reasons,
      recommendedNextStep:
        missingRequiredItems.length > 0
          ? 'Resume the TPS flow, complete the missing required answers, and then review the remaining warning items.'
          : 'Review the warning items and confirm any unclear facts before relying on this screening result.',
      warningItems: reviewAreas,
    }
  }

  return {
    status: 'Likely eligible',
    explanation:
      'Based on this limited rule set, the answers do not show an obvious TPS issue. This is only a preliminary screening result and not legal advice.',
    missingRequiredItems: [],
    readinessNote:
      'The interview appears complete under the current TPS question set.',
    reasons,
    recommendedNextStep:
      'Review the summary with the client, confirm supporting facts and documents, and continue to a full legal review if appropriate.',
    warningItems: [],
  }
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}
