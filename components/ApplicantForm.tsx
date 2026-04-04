'use client'

import { ChangeEvent, FormEvent, useState } from 'react'

import {
  ApplicantInput,
  createApplicant,
} from '../lib/applicantService'
import { ApplicantProfileFields } from './ApplicantProfileFields'

type ApplicantFormProps = {
  externalErrorMessage?: string
  onApplicantCreated: () => Promise<void>
}

const initialFormValues: ApplicantInput = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  dob: '',
  country_of_birth: '',
  country_of_citizenship: '',
  a_number: '',
  uscis_online_account_number: '',
  passport_number: '',
  passport_country: '',
  entry_date_us: '',
  i94_number: '',
  current_status: '',
  flow_type: 'TPS',
}

export function ApplicantForm({
  externalErrorMessage = '',
  onApplicantCreated,
}: ApplicantFormProps) {
  const [formValues, setFormValues] = useState<ApplicantInput>(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))

    if (successMessage) {
      setSuccessMessage('')
    }

    if (errorMessage) {
      setErrorMessage('')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      await createApplicant(formValues)
      setFormValues(initialFormValues)
      setSuccessMessage('Applicant saved.')
      await onApplicantCreated()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to save applicant.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
          Applicant intake
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            color: '#475569',
          }}
        >
          Capture a new intake and review recent applicants below.
        </p>
      </div>

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
          disabled={isSubmitting}
          style={{
            border: 0,
            borderRadius: 10,
            backgroundColor: isSubmitting ? '#94a3b8' : '#0f172a',
            color: '#ffffff',
            padding: '12px 16px',
            fontSize: '1rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save applicant'}
        </button>
      </form>

      {successMessage ? (
        <p style={{ margin: '16px 0 0', color: '#166534' }}>
          {successMessage}
        </p>
      ) : null}

      {errorMessage || externalErrorMessage ? (
        <p style={{ margin: '16px 0 0', color: '#b91c1c' }}>
          {errorMessage || externalErrorMessage}
        </p>
      ) : null}
    </section>
  )
}
