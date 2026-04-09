'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  FlowEvaluationResult,
  getMissingRequiredQuestions,
  getVisibleQuestions,
  InterviewAnswers,
  Question,
  validateQuestionAnswer,
} from '../../lib/interview'
import { QuestionRenderer } from './QuestionRenderer'

type InterviewFlowProps = {
  backHref?: string
  backLabel?: string
  evaluateAnswers?: (
    answers: InterviewAnswers,
    questions: Question[]
  ) => FlowEvaluationResult
  initialAnswers?: InterviewAnswers
  onSaveAnswers?: (answers: InterviewAnswers) => Promise<void>
  subtitle?: string
  questions: Question[]
  title: string
}

export function InterviewFlow({
  backHref = '/',
  backLabel = 'Back to intake',
  evaluateAnswers,
  initialAnswers = {},
  onSaveAnswers,
  questions,
  subtitle,
  title,
}: InterviewFlowProps) {
  const [answers, setAnswers] = useState<InterviewAnswers>(initialAnswers)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  )
  const [saveError, setSaveError] = useState('')
  const [validationError, setValidationError] = useState('')
  const hasHydratedInitialAnswers = useRef(false)
  const lastSavedAnswersRef = useRef<string>(JSON.stringify(initialAnswers))

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(questions, answers),
    [answers, questions]
  )

  useEffect(() => {
    setAnswers(initialAnswers)
    setShowSummary(false)
    setValidationError('')
    setCurrentIndex(getFirstIncompleteQuestionIndex(questions, initialAnswers))
    hasHydratedInitialAnswers.current = false
    lastSavedAnswersRef.current = JSON.stringify(initialAnswers)
  }, [initialAnswers, questions])

  useEffect(() => {
    if (visibleQuestions.length === 0) {
      setCurrentIndex(0)
      return
    }

    if (currentIndex > visibleQuestions.length - 1) {
      setCurrentIndex(visibleQuestions.length - 1)
    }
  }, [currentIndex, visibleQuestions])

  const currentQuestion = visibleQuestions[currentIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] ?? '' : ''
  const isLastQuestion = currentIndex === visibleQuestions.length - 1
  const evaluationResult = evaluateAnswers
    ? evaluateAnswers(answers, questions)
    : null

  useEffect(() => {
    if (!onSaveAnswers) {
      return
    }

    if (!hasHydratedInitialAnswers.current) {
      hasHydratedInitialAnswers.current = true
      return
    }

    const serializedAnswers = JSON.stringify(answers)
    if (serializedAnswers === lastSavedAnswersRef.current) {
      return
    }

    setSaveState('saving')
    setSaveError('')

    const timeoutId = window.setTimeout(() => {
      void persistAnswers(answers)
    }, 800)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [answers, onSaveAnswers])

  function handleAnswerChange(value: string) {
    if (!currentQuestion) {
      return
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.id]: value,
    }))

    setValidationError(validateQuestionAnswer(currentQuestion, value) ?? '')

    if (showSummary) {
      setShowSummary(false)
    }

    if (saveState === 'saved') {
      setSaveState('idle')
    }

    if (saveError) {
      setSaveError('')
    }
  }

  async function handleBack() {
    if (showSummary) {
      setShowSummary(false)
      setCurrentIndex(Math.max(visibleQuestions.length - 1, 0))
      return
    }

    await persistAnswers(answers)
    setValidationError('')
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  async function handleNext() {
    if (!currentQuestion) {
      return
    }

    const nextValidationError = validateQuestionAnswer(
      currentQuestion,
      currentAnswer
    )

    if (nextValidationError) {
      setValidationError(nextValidationError)
      return
    }

    const didPersist = await persistAnswers(answers)
    if (!didPersist) {
      return
    }

    setValidationError('')

    if (isLastQuestion) {
      setShowSummary(true)
      return
    }

    setCurrentIndex((index) => Math.min(index + 1, visibleQuestions.length - 1))
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '48px 16px',
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: 720,
          display: 'grid',
          gap: 24,
        }}
      >
        <div>
          <Link
            href={backHref}
            style={{
              color: '#0f172a',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            {backLabel}
          </Link>
        </div>

        <section
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
            display: 'grid',
            gap: 24,
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <h1
              style={{
                margin: 0,
                fontSize: '2rem',
                color: '#0f172a',
              }}
            >
              {title}
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>
              {subtitle ||
                'Answer one question at a time. Conditional questions appear only when they apply.'}
            </p>
          </div>

          {showSummary ? (
            <SummaryScreen
              answers={answers}
              evaluationResult={evaluationResult}
              questions={visibleQuestions}
            />
          ) : currentQuestion ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  color: '#475569',
                  fontSize: '0.95rem',
                }}
              >
                <span>
                  Question {currentIndex + 1} of {visibleQuestions.length}
                </span>
                <span>{currentQuestion.type.replace('_', ' ')}</span>
              </div>

              <QuestionRenderer
                answer={currentAnswer}
                answers={answers}
                errorMessage={validationError}
                onChange={handleAnswerChange}
                question={currentQuestion}
              />
            </>
          ) : (
            <p style={{ margin: 0, color: '#475569' }}>
              No questions are available for this flow yet.
            </p>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => void handleBack()}
              disabled={!showSummary && currentIndex === 0}
              style={{
                ...navigationButtonStyles,
                backgroundColor: '#ffffff',
                color: '#0f172a',
                cursor:
                  !showSummary && currentIndex === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Back
            </button>

            {!showSummary && currentQuestion ? (
              <button
                type="button"
                onClick={() => void handleNext()}
                style={{
                  ...navigationButtonStyles,
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                {isLastQuestion ? 'View summary' : 'Next'}
              </button>
            ) : null}
          </div>

          {saveState === 'saving' ? (
            <p style={{ margin: 0, color: '#475569' }}>Saving progress...</p>
          ) : null}

          {saveState === 'saved' ? (
            <p style={{ margin: 0, color: '#166534' }}>Progress saved.</p>
          ) : null}

          {saveState === 'error' ? (
            <p style={{ margin: 0, color: '#b91c1c' }}>
              {saveError || 'Unable to save progress.'}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  )

  async function persistAnswers(nextAnswers: InterviewAnswers): Promise<boolean> {
    if (!onSaveAnswers) {
      return true
    }

    setSaveState('saving')
    setSaveError('')

    try {
      await onSaveAnswers(nextAnswers)
      lastSavedAnswersRef.current = JSON.stringify(nextAnswers)
      setSaveState('saved')
      return true
    } catch (error) {
      setSaveState('error')
      setSaveError(
        error instanceof Error ? error.message : 'Unable to save progress.'
      )
      return false
    }
  }
}

function SummaryScreen({
  answers,
  evaluationResult,
  questions,
}: {
  answers: InterviewAnswers
  evaluationResult: FlowEvaluationResult | null
  questions: Question[]
}) {
  const completedQuestions = questions.filter((question) => {
    const answer = answers[question.id] ?? ''
    return answer.trim() !== '' && !validateQuestionAnswer(question, answer)
  })
  const missingRequiredQuestions = getMissingRequiredQuestions(questions, answers)
  const warningItems = evaluationResult?.warningItems ?? []

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <h2
        style={{
          margin: 0,
          fontSize: '1.5rem',
          color: '#0f172a',
        }}
      >
        Review summary
      </h2>

      {evaluationResult ? (
        <section
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            padding: 16,
            display: 'grid',
            gap: 12,
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ color: '#475569', fontSize: '0.9rem' }}>
              TPS result status
            </span>
            <strong style={{ color: getStatusColor(evaluationResult.status) }}>
              {evaluationResult.status}
            </strong>
          </div>

          <p style={{ margin: 0, color: '#334155' }}>
            {evaluationResult.explanation}
          </p>

          {evaluationResult.readinessNote ? (
            <p style={{ margin: 0, color: '#475569' }}>
              {evaluationResult.readinessNote}
            </p>
          ) : null}

          <ReviewSection
            emptyText="No specific reasons were recorded for this result."
            items={evaluationResult.reasons.map((reason) => ({
              label: 'Reason',
              value: reason,
            }))}
            title="Why this result was reached"
          />

          <div style={{ display: 'grid', gap: 8 }}>
            <strong style={{ color: '#0f172a' }}>Recommended next step</strong>
            <p style={{ margin: 0, color: '#334155' }}>
              {evaluationResult.recommendedNextStep}
            </p>
          </div>
        </section>
      ) : null}

      <ReviewSection
        emptyText="No completed answers yet."
        items={completedQuestions.map((question) => ({
          label: question.label,
          value: formatAnswer(question, answers[question.id] ?? ''),
        }))}
        title="Completed answers"
      />

      <ReviewSection
        emptyText="No required answers are currently missing."
        items={missingRequiredQuestions.map((question) => ({
          label: question.label,
          value: validateQuestionAnswer(question, answers[question.id] ?? '') ?? '',
        }))}
        title="Missing required items"
      />

      <ReviewSection
        emptyText="No warning or risk items from this rule set."
        items={warningItems.map((item) => ({
          label: 'Review item',
          value: item,
        }))}
        title="Warning or risk items"
      />
    </div>
  )
}

function formatAnswer(question: Question, answer: string): string {
  if (!answer) {
    return 'No answer provided'
  }

  if (question.type === 'yes_no') {
    return answer === 'yes' ? 'Yes' : 'No'
  }

  if (question.type === 'select') {
    return (
      question.options?.find((option) => option.value === answer)?.label ?? answer
    )
  }

  return answer
}

const navigationButtonStyles = {
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  padding: '12px 16px',
  fontSize: '1rem',
} as const

function getStatusColor(status: FlowEvaluationResult['status']): string {
  if (status === 'Likely eligible') {
    return '#166534'
  }

  if (status === 'Needs review') {
    return '#92400e'
  }

  return '#b91c1c'
}

function getFirstIncompleteQuestionIndex(
  questions: Question[],
  answers: InterviewAnswers
): number {
  const visibleQuestions = getVisibleQuestions(questions, answers)
  const firstIncompleteIndex = visibleQuestions.findIndex((question) =>
    Boolean(validateQuestionAnswer(question, answers[question.id] ?? ''))
  )

  return firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex
}

function ReviewSection({
  emptyText,
  items,
  title,
}: {
  emptyText: string
  items: Array<{ label: string; value: string }>
  title: string
}) {
  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h3
        style={{
          margin: 0,
          fontSize: '1.1rem',
          color: '#0f172a',
        }}
      >
        {title}
      </h3>

      {items.length === 0 ? (
        <p style={{ margin: 0, color: '#64748b' }}>{emptyText}</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <article
              key={`${title}-${item.label}-${item.value}`}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
                display: 'grid',
                gap: 6,
              }}
            >
              <strong style={{ color: '#0f172a' }}>{item.label}</strong>
              <span style={{ color: '#334155' }}>{item.value}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
