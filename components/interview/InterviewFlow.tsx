'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import {
  getVisibleQuestions,
  InterviewAnswers,
  Question,
} from '../../lib/interview'
import { QuestionRenderer } from './QuestionRenderer'

type InterviewFlowProps = {
  questions: Question[]
  title: string
}

export function InterviewFlow({ questions, title }: InterviewFlowProps) {
  const [answers, setAnswers] = useState<InterviewAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSummary, setShowSummary] = useState(false)

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(questions, answers),
    [answers, questions]
  )

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

  function handleAnswerChange(value: string) {
    if (!currentQuestion) {
      return
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.id]: value,
    }))

    if (showSummary) {
      setShowSummary(false)
    }
  }

  function handleBack() {
    if (showSummary) {
      setShowSummary(false)
      setCurrentIndex(Math.max(visibleQuestions.length - 1, 0))
      return
    }

    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  function handleNext() {
    if (!currentQuestion) {
      return
    }

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
            href="/"
            style={{
              color: '#0f172a',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Back to intake
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
              Answer one question at a time. Conditional questions appear only
              when they apply.
            </p>
          </div>

          {showSummary ? (
            <SummaryScreen
              answers={answers}
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
              onClick={handleBack}
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
                onClick={handleNext}
                disabled={isCurrentQuestionBlocked(currentQuestion, currentAnswer)}
                style={{
                  ...navigationButtonStyles,
                  backgroundColor: isCurrentQuestionBlocked(
                    currentQuestion,
                    currentAnswer
                  )
                    ? '#94a3b8'
                    : '#0f172a',
                  color: '#ffffff',
                  cursor: isCurrentQuestionBlocked(currentQuestion, currentAnswer)
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                {isLastQuestion ? 'View summary' : 'Next'}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function SummaryScreen({
  answers,
  questions,
}: {
  answers: InterviewAnswers
  questions: Question[]
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2
        style={{
          margin: 0,
          fontSize: '1.5rem',
          color: '#0f172a',
        }}
      >
        Summary
      </h2>

      <div style={{ display: 'grid', gap: 12 }}>
        {questions.map((question) => (
          <article
            key={question.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              display: 'grid',
              gap: 6,
            }}
          >
            <strong style={{ color: '#0f172a' }}>{question.label}</strong>
            <span style={{ color: '#334155' }}>
              {formatAnswer(question, answers[question.id] ?? '')}
            </span>
          </article>
        ))}
      </div>
    </div>
  )
}

function isCurrentQuestionBlocked(question: Question, answer: string): boolean {
  if (!question.required) {
    return false
  }

  return answer.trim() === ''
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
