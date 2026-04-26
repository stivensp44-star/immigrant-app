import { supabase } from './supabaseClient'

export type Applicant = {
  id: number
  created_at: string
  first_name: string
  last_name: string
  email: string
  daytime_phone: string | null
  mobile_phone: string | null
  date_of_birth: string | null
  country_of_birth: string | null
  countries_of_citizenship: string[]
  a_number: string | null
  uscis_online_account_number: string | null
  passport_number: string | null
  passport_country_of_issuance: string | null
  last_entry_date: string | null
  i94_number: string | null
  current_immigration_status: string | null
}

export type ApplicantInput = {
  first_name: string
  last_name: string
  email: string
  daytime_phone: string
  mobile_phone: string
  date_of_birth: string
  country_of_birth: string
  countries_of_citizenship: string[]
  a_number: string
  uscis_online_account_number: string
  passport_number: string
  passport_country_of_issuance: string
  last_entry_date: string
  i94_number: string
  current_immigration_status: string
}

const applicantSelectFields =
  'id, created_at, first_name, last_name, email, daytime_phone, mobile_phone, date_of_birth, country_of_birth, countries_of_citizenship, a_number, uscis_online_account_number, passport_number, passport_country_of_issuance, last_entry_date, i94_number, current_immigration_status'

export function toApplicantInput(applicant: Applicant): ApplicantInput {
  return {
    first_name: applicant.first_name,
    last_name: applicant.last_name,
    email: applicant.email,
    daytime_phone: applicant.daytime_phone ?? '',
    mobile_phone: applicant.mobile_phone ?? '',
    date_of_birth: applicant.date_of_birth ?? '',
    country_of_birth: applicant.country_of_birth ?? '',
    countries_of_citizenship: applicant.countries_of_citizenship ?? [],
    a_number: applicant.a_number ?? '',
    uscis_online_account_number: applicant.uscis_online_account_number ?? '',
    passport_number: applicant.passport_number ?? '',
    passport_country_of_issuance: applicant.passport_country_of_issuance ?? '',
    last_entry_date: applicant.last_entry_date ?? '',
    i94_number: applicant.i94_number ?? '',
    current_immigration_status: applicant.current_immigration_status ?? '',
  }
}

export async function fetchApplicants(): Promise<Applicant[]> {
  const vendorId = await getCurrentVendorId()
  const { data, error } = await supabase
    .from('applicants')
    .select(applicantSelectFields)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return ((data as Applicant[] | null) ?? []).map(normalizeApplicant)
}

export async function fetchApplicantById(
  id: number | string
): Promise<Applicant> {
  const vendorId = await getCurrentVendorId()
  const { data, error } = await supabase
    .from('applicants')
    .select(applicantSelectFields)
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeApplicant(data as Applicant)
}

export async function createApplicant(payload: ApplicantInput): Promise<void> {
  const vendorId = await getCurrentVendorId()
  const { error } = await supabase
    .from('applicants')
    .insert(serializeApplicantPayload(payload, vendorId))

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateApplicant(
  id: number | string,
  payload: ApplicantInput
): Promise<void> {
  const vendorId = await getCurrentVendorId()
  const { error } = await supabase
    .from('applicants')
    .update(serializeApplicantPayload(payload))
    .eq('id', id)
    .eq('vendor_id', vendorId)

  if (error) {
    throw new Error(error.message)
  }
}

function serializeApplicantPayload(payload: ApplicantInput, vendorId?: string) {
  return {
    ...(vendorId ? { vendor_id: vendorId } : {}),
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
    email: payload.email.trim(),
    daytime_phone: normalizeOptionalValue(payload.daytime_phone),
    mobile_phone: normalizeOptionalValue(payload.mobile_phone),
    date_of_birth: normalizeOptionalValue(payload.date_of_birth),
    country_of_birth: normalizeOptionalValue(payload.country_of_birth),
    countries_of_citizenship: normalizeStringArray(
      payload.countries_of_citizenship
    ),
    a_number: normalizeOptionalValue(payload.a_number),
    uscis_online_account_number: normalizeOptionalValue(
      payload.uscis_online_account_number
    ),
    passport_number: normalizeOptionalValue(payload.passport_number),
    passport_country_of_issuance: normalizeOptionalValue(
      payload.passport_country_of_issuance
    ),
    last_entry_date: normalizeOptionalValue(payload.last_entry_date),
    i94_number: normalizeOptionalValue(payload.i94_number),
    current_immigration_status: normalizeOptionalValue(
      payload.current_immigration_status
    ),
  }
}

async function getCurrentVendorId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error('Vendor authentication is required.')
  }

  return data.user.id
}

function normalizeOptionalValue(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function normalizeStringArray(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

function normalizeApplicant(applicant: Applicant): Applicant {
  return {
    ...applicant,
    countries_of_citizenship: Array.isArray(applicant.countries_of_citizenship)
      ? applicant.countries_of_citizenship
      : [],
  }
}