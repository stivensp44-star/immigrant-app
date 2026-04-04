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
