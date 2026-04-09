export type QuestionType = 'text' | 'date' | 'select' | 'yes_no'

export type QuestionOption = {
  label: string
  value: string
}

export type QuestionCondition = {
  questionId: string
  value: string
}

export type Question = {
  id: string
  label: string
  type: QuestionType
  options?: QuestionOption[]
  required?: boolean
  condition?: QuestionCondition
}

export type InterviewAnswers = Record<string, string>
export type FlowAnswersMap = Record<string, InterviewAnswers>
export type FlowResultStatus =
  | 'Likely eligible'
  | 'Needs review'
  | 'Potential issue identified'

export type FlowEvaluationResult = {
  explanation: string
  missingRequiredItems: string[]
  readinessNote?: string
  reasons: string[]
  recommendedNextStep: string
  status: FlowResultStatus
  warningItems: string[]
}

export function isQuestionVisible(
  question: Question,
  answers: InterviewAnswers
): boolean {
  if (!question.condition) {
    return true
  }

  return answers[question.condition.questionId] === question.condition.value
}

export function getVisibleQuestions(
  questions: Question[],
  answers: InterviewAnswers
): Question[] {
  return questions.filter((question) => isQuestionVisible(question, answers))
}

export function validateQuestionAnswer(
  question: Question,
  answer: string
): string | null {
  const trimmedAnswer = answer.trim()

  if (question.required && !trimmedAnswer) {
    return `${question.label} is required.`
  }

  if (!trimmedAnswer) {
    return null
  }

  if (question.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedAnswer)) {
      return `${question.label} must be a valid date.`
    }

    const parsedDate = new Date(`${trimmedAnswer}T00:00:00Z`)
    if (Number.isNaN(parsedDate.getTime())) {
      return `${question.label} must be a valid date.`
    }

    const normalizedDate = parsedDate.toISOString().slice(0, 10)
    if (normalizedDate !== trimmedAnswer) {
      return `${question.label} must be a valid date.`
    }
  }

  if (question.type === 'select') {
    const allowedValues = question.options?.map((option) => option.value) ?? []
    if (!allowedValues.includes(trimmedAnswer)) {
      return `Select a valid option for ${question.label}.`
    }
  }

  if (question.type === 'yes_no') {
    if (!['yes', 'no'].includes(trimmedAnswer)) {
      return `Choose Yes or No for ${question.label}.`
    }
  }

  return null
}

export function getMissingRequiredQuestions(
  questions: Question[],
  answers: InterviewAnswers
): Question[] {
  return getVisibleQuestions(questions, answers).filter(
    (question) =>
      question.required &&
      Boolean(validateQuestionAnswer(question, answers[question.id] ?? ''))
  )
}
