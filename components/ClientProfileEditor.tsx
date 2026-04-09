'use client'

import Link from 'next/link'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { ApplicantProfileFields } from './ApplicantProfileFields'
import {
  Applicant,
  ApplicantInput,
  fetchApplicantById,
  toApplicantInput,
  updateApplicant,
} from '../lib/applicantService'
import { deriveTpsFlowStatus } from '../lib/flows/tpsStatus'

type ClientProfileEditorProps = {
  applicantId: string
}

export function ClientProfileEditor({
  applicantId,
}: ClientProfileEditorProps) {
  const [applicant, setApplicant] = useState<Applicant | null>(null)
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
      setApplicant(applicant)
      setFormValues(toApplicantInput(applicant))
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load client.'
      )
      setApplicant(null)
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
      setApplicant((currentApplicant) =>
        currentApplicant
          ? {
              ...currentApplicant,
              ...toPersistedApplicantFields(formValues),
            }
          : currentApplicant
      )
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
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
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
            <Link
              href={`/clients/${applicantId}/flows/tps`}
              style={{
                color: '#0f172a',
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              Open TPS flow
            </Link>
          </div>
        </div>

        <section
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
            display: 'grid',
            gap: 16,
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                color: '#0f172a',
              }}
            >
              TPS workflow
            </h2>
            <p
              style={{
                margin: 0,
                color: '#475569',
              }}
            >
              Review current TPS progress and jump back into the guided flow.
            </p>
          </div>

          {isLoadingApplicant ? (
            <p style={{ margin: 0, color: '#475569' }}>Loading TPS status...</p>
          ) : applicant ? (
            <TpsStatusCard applicant={applicant} />
          ) : (
            <p style={{ margin: 0, color: '#b91c1c' }}>
              TPS status is unavailable until the client record loads.
            </p>
          )}
        </section>

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

function TpsStatusCard({ applicant }: { applicant: Applicant }) {
  const tpsStatus = deriveTpsFlowStatus(applicant)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          display: 'grid',
          gap: 10,
        }}
      >
        <StatusRow
          label="Flow state"
          value={formatProgressState(tpsStatus.progressState)}
        />
        <StatusRow
          label="TPS result"
          value={tpsStatus.resultStatus ?? 'No result yet'}
        />
        <StatusRow
          label="Required items remaining"
          value={String(tpsStatus.missingRequiredCount)}
        />
        {tpsStatus.lastUpdatedLabel ? (
          <StatusRow
            label="Last updated"
            value={tpsStatus.lastUpdatedLabel}
          />
        ) : null}
      </div>

      <Link
        href={tpsStatus.actionHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 16px',
          fontSize: '1rem',
          textDecoration: 'none',
          width: 'fit-content',
        }}
      >
        {tpsStatus.actionLabel}
      </Link>
    </div>
  )
}

function StatusRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: '#475569' }}>{label}</span>
      <strong style={{ color: '#0f172a' }}>{value}</strong>
    </div>
  )
}

function formatProgressState(progressState: ReturnType<typeof deriveTpsFlowStatus>['progressState']) {
  if (progressState === 'not_started') {
    return 'Not started'
  }

  if (progressState === 'in_progress') {
    return 'In progress'
  }

  return 'Completed'
}

function toPersistedApplicantFields(formValues: ApplicantInput) {
  return {
    first_name: formValues.first_name.trim(),
    last_name: formValues.last_name.trim(),
    email: formValues.email.trim(),
    phone: normalizeOptionalValue(formValues.phone),
    dob: normalizeOptionalValue(formValues.dob),
    country_of_birth: normalizeOptionalValue(formValues.country_of_birth),
    country_of_citizenship: normalizeOptionalValue(
      formValues.country_of_citizenship
    ),
    a_number: normalizeOptionalValue(formValues.a_number),
    uscis_online_account_number: normalizeOptionalValue(
      formValues.uscis_online_account_number
    ),
    passport_number: normalizeOptionalValue(formValues.passport_number),
    passport_country: normalizeOptionalValue(formValues.passport_country),
    entry_date_us: normalizeOptionalValue(formValues.entry_date_us),
    i94_number: normalizeOptionalValue(formValues.i94_number),
    current_status: normalizeOptionalValue(formValues.current_status),
    flow_type: formValues.flow_type,
  }
}

function normalizeOptionalValue(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}
