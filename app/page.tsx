'use client'

import { useEffect, useState } from 'react'

import { ApplicantForm } from '../components/ApplicantForm'
import { ApplicantList } from '../components/ApplicantList'
import { Applicant, fetchApplicants } from '../lib/applicantService'

export default function Home() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    void loadApplicants()
  }, [])

  async function loadApplicants() {
    setIsLoadingApplicants(true)
    setErrorMessage('')

    try {
      const data = await fetchApplicants()
      setApplicants(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load applicants.'
      )
      setApplicants([])
    } finally {
      setIsLoadingApplicants(false)
    }
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
        <ApplicantForm
          externalErrorMessage={errorMessage}
          onApplicantCreated={loadApplicants}
        />

        <ApplicantList
          applicants={applicants}
          isLoadingApplicants={isLoadingApplicants}
          onRefresh={() => void loadApplicants()}
        />
      </div>
    </main>
  )
}
