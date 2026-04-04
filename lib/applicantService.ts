import { supabase } from './supabaseClient'
import { FlowAnswersMap, InterviewAnswers } from './interview'

export type FlowType = 'TPS' | 'TPS_EAD' | 'ASYLUM_EAD'

export type Applicant = {
  id: number
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  dob: string | null
  country_of_birth: string | null
  country_of_citizenship: string | null
  a_number: string | null
  uscis_online_account_number: string | null
  passport_number: string | null
  passport_country: string | null
  entry_date_us: string | null
  i94_number: string | null
  current_status: string | null
  flow_type: FlowType
  flow_answers: FlowAnswersMap
}

export type ApplicantInput = {
  first_name: string
  last_name: string
  email: string
  phone: string
  dob: string
  country_of_birth: string
  country_of_citizenship: string
  a_number: string
  uscis_online_account_number: string
  passport_number: string
  passport_country: string
  entry_date_us: string
  i94_number: string
  current_status: string
  flow_type: FlowType
}

const applicantSelectFields =
  'id, created_at, first_name, last_name, email, phone, dob, country_of_birth, country_of_citizenship, a_number, uscis_online_account_number, passport_number, passport_country, entry_date_us, i94_number, current_status, flow_type, flow_answers'

export function toApplicantInput(applicant: Applicant): ApplicantInput {
  return {
    first_name: applicant.first_name,
    last_name: applicant.last_name,
    email: applicant.email,
    phone: applicant.phone ?? '',
    dob: applicant.dob ?? '',
    country_of_birth: applicant.country_of_birth ?? '',
    country_of_citizenship: applicant.country_of_citizenship ?? '',
    a_number: applicant.a_number ?? '',
    uscis_online_account_number: applicant.uscis_online_account_number ?? '',
    passport_number: applicant.passport_number ?? '',
    passport_country: applicant.passport_country ?? '',
    entry_date_us: applicant.entry_date_us ?? '',
    i94_number: applicant.i94_number ?? '',
    current_status: applicant.current_status ?? '',
    flow_type: applicant.flow_type,
  }
}

export async function fetchApplicants(): Promise<Applicant[]> {
  const { data, error } = await supabase
    .from('applicants')
    .select(applicantSelectFields)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return ((data as Applicant[] | null) ?? []).map(normalizeApplicant)
}

export async function fetchApplicantById(id: number | string): Promise<Applicant> {
  const { data, error } = await supabase
    .from('applicants')
    .select(applicantSelectFields)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeApplicant(data as Applicant)
}

export async function createApplicant(payload: ApplicantInput): Promise<void> {
  const { error } = await supabase
    .from('applicants')
    .insert(serializeApplicantPayload(payload))

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateApplicant(
  id: number | string,
  payload: ApplicantInput
): Promise<void> {
  const { error } = await supabase
    .from('applicants')
    .update(serializeApplicantPayload(payload))
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchApplicantFlowAnswers(
  id: number | string,
  flowId: string
): Promise<InterviewAnswers> {
  const { data, error } = await supabase
    .from('applicants')
    .select('flow_answers')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const flowAnswers = normalizeFlowAnswersMap(data?.flow_answers)
  return flowAnswers[flowId] ?? {}
}

export async function saveApplicantFlowAnswers(
  id: number | string,
  flowId: string,
  answers: InterviewAnswers
): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('applicants')
    .select('flow_answers')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const currentFlowAnswers = normalizeFlowAnswersMap(data?.flow_answers)

  const { error: updateError } = await supabase
    .from('applicants')
    .update({
      flow_answers: {
        ...currentFlowAnswers,
        [flowId]: answers,
      },
    })
    .eq('id', id)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

function serializeApplicantPayload(payload: ApplicantInput) {
  return {
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
    email: payload.email.trim(),
    phone: normalizeOptionalValue(payload.phone),
    dob: normalizeOptionalValue(payload.dob),
    country_of_birth: normalizeOptionalValue(payload.country_of_birth),
    country_of_citizenship: normalizeOptionalValue(
      payload.country_of_citizenship
    ),
    a_number: normalizeOptionalValue(payload.a_number),
    uscis_online_account_number: normalizeOptionalValue(
      payload.uscis_online_account_number
    ),
    passport_number: normalizeOptionalValue(payload.passport_number),
    passport_country: normalizeOptionalValue(payload.passport_country),
    entry_date_us: normalizeOptionalValue(payload.entry_date_us),
    i94_number: normalizeOptionalValue(payload.i94_number),
    current_status: normalizeOptionalValue(payload.current_status),
    flow_type: payload.flow_type,
  }
}

function normalizeOptionalValue(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function normalizeApplicant(applicant: Applicant): Applicant {
  return {
    ...applicant,
    flow_answers: normalizeFlowAnswersMap(applicant.flow_answers),
  }
}

function normalizeFlowAnswersMap(value: unknown): FlowAnswersMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const normalizedValue: FlowAnswersMap = {}

  for (const [flowId, answers] of Object.entries(value)) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      continue
    }

    normalizedValue[flowId] = {}

    for (const [questionId, answer] of Object.entries(answers)) {
      normalizedValue[flowId][questionId] =
        typeof answer === 'string' ? answer : String(answer ?? '')
    }
  }

  return normalizedValue
}
