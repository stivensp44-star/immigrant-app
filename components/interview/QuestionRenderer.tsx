'use client'

import { InterviewAnswers, Question } from '../../lib/interview'

type QuestionRendererProps = {
  answer: string
  answers: InterviewAnswers
  onChange: (value: string) => void
  question: Question
}

export function QuestionRenderer({
  answer,
  answers,
  onChange,
  question,
}: QuestionRendererProps) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <label
          htmlFor={question.id}
          style={{
            color: '#0f172a',
            fontSize: '1.1rem',
            fontWeight: 600,
          }}
        >
          {question.label}
        </label>
        {question.required ? (
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Required
          </span>
        ) : null}
      </div>

      {renderInput(question, answer, onChange)}

      {question.condition ? (
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          This question appears when "{question.condition.questionId}" is{' '}
          {answers[question.condition.questionId] || 'not yet answered'}.
        </p>
      ) : null}
    </div>
  )
}

function renderInput(
  question: Question,
  answer: string,
  onChange: (value: string) => void
) {
  if (question.type === 'text') {
    return (
      <input
        id={question.id}
        type="text"
        value={answer}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyles}
      />
    )
  }

  if (question.type === 'date') {
    return (
      <input
        id={question.id}
        type="date"
        value={answer}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyles}
      />
    )
  }

  if (question.type === 'select') {
    return (
      <select
        id={question.id}
        value={answer}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyles}
      >
        <option value="">Select an option</option>
        {question.options?.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {[
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ].map((option) => {
        const isSelected = answer === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              ...yesNoButtonStyles,
              backgroundColor: isSelected ? '#0f172a' : '#ffffff',
              color: isSelected ? '#ffffff' : '#0f172a',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

const inputStyles = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  padding: '12px 14px',
  fontSize: '1rem',
  backgroundColor: '#ffffff',
  color: '#0f172a',
} as const

const yesNoButtonStyles = {
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  padding: '12px 18px',
  fontSize: '1rem',
  cursor: 'pointer',
} as const
