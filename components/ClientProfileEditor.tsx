'use client'

import Link from 'next/link'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { ApplicantProfileFields } from './ApplicantProfileFields'
import {
  ApplicantInput,
  fetchApplicantById,
  toApplicantInput,
  updateApplicant,
} from '../lib/applicantService'

type ClientProfileEditorProps = {
  applicantId: string
}

export function ClientProfileEditor({
  applicantId,
}: ClientProfileEditorProps) {
  const [formValues, setFormValues] = useState<ApplicantInput | null>(null)
  const [isLoadingApplicant, setIsLoadingApplicant] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    void loadApplicant()
  }, [applicantId])

  async function loadApplicant() {
    setIsLoadingApplicant(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const applicant = await fetchApplicantById(applicantId)
      setFormValues(toApplicantInput(applicant))
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load client.'
      )
      setFormValues(null)
    } finally {
      setIsLoadingApplicant(false)
    }
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target

    setFormValues((currentValues) =>
      currentValues
        ? {
            ...currentValues,
            [name]: value,
          }
        : currentValues
    )

    if (successMessage) {
      setSuccessMessage('')
    }

    if (errorMessage) {
      setErrorMessage('')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formValues) {
      return
    }

    setIsSaving(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      await updateApplicant(applicantId, formValues)
      setSuccessMessage('Client profile updated.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to update client.'
      )
    } finally {
      setIsSaving(false)
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
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <h1
              style={{
                margin: 0,
                fontSize: '2rem',
                color: '#0f172a',
              }}
            >
              Client profile
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                color: '#475569',
              }}
            >
              Review and update the saved client profile.
            </p>
          </div>

          {isLoadingApplicant ? (
            <p style={{ margin: 0, color: '#475569' }}>Loading client...</p>
          ) : !formValues ? (
            <p style={{ margin: 0, color: '#b91c1c' }}>
              {errorMessage || 'Client not found.'}
            </p>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                style={{ display: 'grid', gap: 16 }}
              >
                <ApplicantProfileFields
                  formValues={formValues}
                  onChange={handleChange}
                />

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    border: 0,
                    borderRadius: 10,
                    backgroundColor: isSaving ? '#94a3b8' : '#0f172a',
                    color: '#ffffff',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </form>

              {successMessage ? (
                <p style={{ margin: '16px 0 0', color: '#166534' }}>
                  {successMessage}
                </p>
              ) : null}

              {errorMessage ? (
                <p style={{ margin: '16px 0 0', color: '#b91c1c' }}>
                  {errorMessage}
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
