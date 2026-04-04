'use client'

import { ChangeEvent } from 'react'

import { ApplicantInput } from '../lib/applicantService'

type ApplicantProfileFieldsProps = {
  formValues: ApplicantInput
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function ApplicantProfileFields({
  formValues,
  onChange,
}: ApplicantProfileFieldsProps) {
  return (
    <>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>First name</span>
          <input
            name="first_name"
            type="text"
            value={formValues.first_name}
            onChange={onChange}
            required
            style={inputStyles}
          />
        </label>

        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>Last name</span>
          <input
            name="last_name"
            type="text"
            value={formValues.last_name}
            onChange={onChange}
            required
            style={inputStyles}
          />
        </label>
      </div>

      <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
        <span>Email</span>
        <input
          name="email"
          type="email"
          value={formValues.email}
          onChange={onChange}
          required
          style={inputStyles}
        />
      </label>

      <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
        <span>Phone</span>
        <input
          name="phone"
          type="tel"
          value={formValues.phone}
          onChange={onChange}
          style={inputStyles}
        />
      </label>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>Date of birth</span>
          <input
            name="dob"
            type="date"
            value={formValues.dob}
            onChange={onChange}
            style={inputStyles}
          />
        </label>

        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>Entry date to U.S.</span>
          <input
            name="entry_date_us"
            type="date"
            value={formValues.entry_date_us}
            onChange={onChange}
            style={inputStyles}
          />
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>Country of birth</span>
          <input
            name="country_of_birth"
            type="text"
            value={formValues.country_of_birth}
            onChange={onChange}
            style={inputStyles}
          />
        </label>

        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>Country of citizenship</span>
          <input
            name="country_of_citizenship"
            type="text"
            value={formValues.country_of_citizenship}
            onChange={onChange}
            style={inputStyles}
          />
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>A-Number</span>
          <input
            name="a_number"
            type="text"
            value={formValues.a_number}
            onChange={onChange}
            style={inputStyles}
          />
        </label>

        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>USCIS online account number</span>
          <input
            name="uscis_online_account_number"
            type="text"
            value={formValues.uscis_online_account_number}
            onChange={onChange}
            style={inputStyles}
          />
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>Passport number</span>
          <input
            name="passport_number"
            type="text"
            value={formValues.passport_number}
            onChange={onChange}
            style={inputStyles}
          />
        </label>

        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>Passport country</span>
          <input
            name="passport_country"
            type="text"
            value={formValues.passport_country}
            onChange={onChange}
            style={inputStyles}
          />
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>I-94 number</span>
          <input
            name="i94_number"
            type="text"
            value={formValues.i94_number}
            onChange={onChange}
            style={inputStyles}
          />
        </label>

        <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
          <span>Current status</span>
          <input
            name="current_status"
            type="text"
            value={formValues.current_status}
            onChange={onChange}
            style={inputStyles}
          />
        </label>
      </div>

      <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
        <span>Flow type</span>
        <select
          name="flow_type"
          value={formValues.flow_type}
          onChange={onChange}
          style={inputStyles}
        >
          <option value="TPS">TPS</option>
          <option value="TPS_EAD">TPS_EAD</option>
          <option value="ASYLUM_EAD">ASYLUM_EAD</option>
        </select>
      </label>
    </>
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
