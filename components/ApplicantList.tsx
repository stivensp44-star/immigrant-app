'use client'

import Link from 'next/link'

import { Applicant } from '../lib/applicantService'

type ApplicantListProps = {
  applicants: Applicant[]
  isLoadingApplicants: boolean
  onRefresh: () => void
}

export function ApplicantList({
  applicants,
  isLoadingApplicants,
  onRefresh,
}: ApplicantListProps) {
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.25rem',
            color: '#0f172a',
          }}
        >
          Saved applicants
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoadingApplicants}
          style={{
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            padding: '8px 12px',
            cursor: isLoadingApplicants ? 'not-allowed' : 'pointer',
            color: '#0f172a',
          }}
        >
          {isLoadingApplicants ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoadingApplicants ? (
        <p style={{ margin: 0, color: '#475569' }}>Loading applicants...</p>
      ) : applicants.length === 0 ? (
        <p style={{ margin: 0, color: '#475569' }}>
          No applicants have been saved yet.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {applicants.map((applicant) => (
            <Link
              key={applicant.id}
              href={`/clients/${applicant.id}`}
              style={{
                textDecoration: 'none',
              }}
            >
              <article
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 16,
                  display: 'grid',
                  gap: 6,
                  backgroundColor: '#ffffff',
                }}
              >
                <strong style={{ color: '#0f172a' }}>
                  {[applicant.first_name, applicant.last_name]
                    .filter(Boolean)
                    .join(' ')}
                </strong>
                <span style={{ color: '#334155' }}>{applicant.email}</span>
                <span style={{ color: '#0f172a' }}>
                  Flow: {applicant.flow_type}
                </span>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
