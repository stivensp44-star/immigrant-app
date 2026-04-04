# TurboCase Schema Map

## Primary Table

### `public.applicants`

Current intended schema is documented in:

- [supabase/schema.sql](/C:/Users/Administrator/projects/immigration-app/supabase/schema.sql)

Additive migration path is documented in:

- [supabase/migrations/001_expand_applicants.sql](/C:/Users/Administrator/projects/immigration-app/supabase/migrations/001_expand_applicants.sql)
- [supabase/migrations/002_add_flow_answers.sql](/C:/Users/Administrator/projects/immigration-app/supabase/migrations/002_add_flow_answers.sql)

## Applicants Columns Expected By The App

- `id bigint`
- `created_at timestamptz`
- `first_name text`
- `last_name text`
- `email text`
- `phone text`
- `dob date`
- `country_of_birth text`
- `country_of_citizenship text`
- `a_number text`
- `uscis_online_account_number text`
- `passport_number text`
- `passport_country text`
- `entry_date_us date`
- `i94_number text`
- `current_status text`
- `flow_type text`
- `flow_answers jsonb`

## Field Usage Map

### Intake / Client Profile

Used by:

- `components/ApplicantForm.tsx`
- `components/ApplicantProfileFields.tsx`
- `components/ClientProfileEditor.tsx`
- `lib/applicantService.ts`

### TPS Guided Flow

Persisted under:

- `applicants.flow_answers.tps`

Structure:

- JSON object keyed by flow id
- TPS flow answers live under `tps`
- individual answer values are stored as strings

Example shape:

```json
{
  "tps": {
    "country_of_citizenship": "Haiti",
    "entry_date_us": "2023-10-01",
    "current_status": "none",
    "continuous_presence": "yes",
    "arrest_history": "no"
  }
}
```

## App Expectations

- Expanded applicant profile fields must exist in the remote database.
- `flow_answers` must exist and default to an empty JSON object.
- `flow_type` is expected to support:
  - `TPS`
  - `TPS_EAD`
  - `ASYLUM_EAD`

## Important Operational Note

The app and repo are currently ahead of the live database until the additive migrations are actually applied to the remote Supabase project. The known runtime symptom is:

- `column applicants.phone does not exist`
