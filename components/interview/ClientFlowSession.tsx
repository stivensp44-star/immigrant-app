'use client'

import { useEffect, useState } from 'react'

import {
  fetchApplicantById,
  fetchApplicantFlowAnswers,
  saveApplicantFlowAnswers,
} from '../../lib/applicantService'
import { InterviewAnswers, Question } from '../../lib/interview'
import { InterviewFlow } from './InterviewFlow'

type ClientFlowSessionProps = {
  applicantId: string
  flowId: string
  questions: Question[]
  title: string
}

export function ClientFlowSession({
  applicantId,
  flowId,
  questions,
  title,
}: ClientFlowSessionProps) {
  const [applicantName, setApplicantName] = useState('')
  const [initialAnswers, setInitialAnswers] = useState<InterviewAnswers | null>(
    null
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadSession()
  }, [applicantId, flowId])

  async function loadSession() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [applicant, answers] = await Promise.all([
        fetchApplicantById(applicantId),
        fetchApplicantFlowAnswers(applicantId, flowId),
      ])

      setApplicantName(
        [applicant.first_name, applicant.last_name].filter(Boolean).join(' ')
      )
      setInitialAnswers(answers)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load flow.'
      )
      setInitialAnswers(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
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
          }}
        >
          <p style={{ margin: 0, color: '#475569' }}>Loading flow...</p>
        </div>
      </main>
    )
  }

  if (!initialAnswers) {
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
          }}
        >
          <p style={{ margin: 0, color: '#b91c1c' }}>
            {errorMessage || 'Unable to open this flow.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <InterviewFlow
      backHref={`/clients/${applicantId}`}
      backLabel="Back to client profile"
      initialAnswers={initialAnswers}
      onSaveAnswers={(answers) =>
        saveApplicantFlowAnswers(applicantId, flowId, answers)
      }
      questions={questions}
      subtitle={
        applicantName
          ? `Working on ${applicantName}. Progress is saved to this client profile.`
          : 'Progress is saved to this client profile.'
      }
      title={title}
    />
  )
}
