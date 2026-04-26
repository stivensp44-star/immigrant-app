-- Migration 010: Applicant canonical profile expansion (Path C — full cleanup).
--
-- Strategy: applicants holds the canonical "current truth" for a client.
-- Each form filing captures a snapshot in forms.client_data_snapshot at
-- generation time.
--
-- This migration is destructive. It:
--   1. Wipes the 2 test rows (no real data exists yet)
--   2. Drops legacy eligibility columns (flow_type, flow_answers) — the
--      product is now form-prep, not eligibility screening
--   3. Renames legacy-named columns to USCIS-aligned names
--   4. Converts country_of_citizenship (singular text) to
--      countries_of_citizenship (text array — I-821 allows up to 4)
--   5. Splits phone into daytime_phone + mobile_phone (I-821 has both)
--   6. Adds the full canonical immigration profile required by I-821 + I-765
--   7. Adds CHECK constraints for format validation and controlled vocabularies
--   8. Adds a vendor-isolation trigger to enforce that child-table rows
--      (spouses, children, address_history, documents, forms) keep
--      vendor_id in sync with the parent applicant
--
-- Type notes: applicants.id = bigint (preserved). Additive only on the child
-- tables created in 009 — this migration does not modify their structure.
--
-- TODO BEFORE PUBLIC LAUNCH: SSN is stored as plain text under RLS protection.
-- This is acceptable for beta (small set of trusted vendors) but MUST be
-- replaced with column-level encryption (pgsodium or pgcrypto) before public
-- launch. Tracking: see Phase 1G hardening checklist.

-- =============================================================================
-- PART 1: WIPE TEST DATA
-- =============================================================================
-- The 2 existing rows are smoke-test data from April 25 2026. We confirmed
-- (via select id, first_name, last_name, email from applicants) they are
-- not real client data. Truncating before column renames avoids any
-- coercion edge cases on those rows.

truncate table public.applicants restart identity cascade;

-- =============================================================================
-- PART 2: DROP LEGACY ELIGIBILITY COLUMNS
-- =============================================================================
-- TurboCase is a form-prep tool, not an eligibility advisor. The flow_type
-- and flow_answers columns powered the deleted eligibility-screening UI
-- (lib/flows/tpsEvaluation.ts and components/interview/*).

alter table public.applicants drop column if exists flow_type;
alter table public.applicants drop column if exists flow_answers;

-- =============================================================================
-- PART 3: RENAME LEGACY-NAMED COLUMNS TO USCIS-ALIGNED NAMES
-- =============================================================================
-- These columns hold the right data but had short or non-standard names.
-- We rename to match field naming on Forms I-821 and I-765 so that the
-- data layer and PDF fill engine can reference the same identifiers.

alter table public.applicants rename column dob to date_of_birth;
alter table public.applicants rename column entry_date_us to last_entry_date;
alter table public.applicants rename column passport_country to passport_country_of_issuance;
alter table public.applicants rename column current_status to current_immigration_status;

-- =============================================================================
-- PART 4: CONVERT country_of_citizenship (text) -> countries_of_citizenship (text[])
-- =============================================================================
-- I-821 Part 2 Item 15 allows up to 4 citizenship countries.
-- The old singular column can't represent dual citizenship.
-- Drop and re-add as array (truncate above means no data is lost).

alter table public.applicants drop column country_of_citizenship;
alter table public.applicants add column countries_of_citizenship text[] not null default '{}';

-- =============================================================================
-- PART 5: SPLIT phone INTO daytime_phone + mobile_phone
-- =============================================================================
-- I-821 Part 8 and I-765 Part 3 both ask for daytime telephone AND mobile
-- telephone separately. The old single phone column can't represent both.

alter table public.applicants drop column phone;
alter table public.applicants add column daytime_phone text;
alter table public.applicants add column mobile_phone text;

-- =============================================================================
-- PART 6: ADD CANONICAL IMMIGRATION PROFILE FIELDS
-- =============================================================================
-- These columns extend applicants with the full set of fields required by
-- I-821 and I-765. They are additive and accept NULL — the interview engine
-- fills them progressively.

-- --- Identity additions ----------------------------------------------------
alter table public.applicants
  add column if not exists middle_name text,
  add column if not exists other_names jsonb not null default '[]'::jsonb,
  add column if not exists other_dates_of_birth jsonb not null default '[]'::jsonb,
  add column if not exists sex text,
  add column if not exists city_of_birth text,
  add column if not exists countries_of_prior_residence text[] not null default '{}';

-- --- US identifiers --------------------------------------------------------
alter table public.applicants
  add column if not exists ssn text;
-- Note: a_number, uscis_online_account_number, i94_number already exist.

-- --- Marital ----------------------------------------------------------------
alter table public.applicants
  add column if not exists marital_status text,
  add column if not exists date_of_current_marriage date;

-- --- Mailing address -------------------------------------------------------
alter table public.applicants
  add column if not exists mailing_in_care_of text,
  add column if not exists mailing_street_line_1 text,
  add column if not exists mailing_street_line_2 text,
  add column if not exists mailing_city text,
  add column if not exists mailing_state text,
  add column if not exists mailing_zip text;

-- --- Physical address (only populated if different from mailing) -----------
alter table public.applicants
  add column if not exists physical_address_same_as_mailing boolean not null default true,
  add column if not exists physical_street_line_1 text,
  add column if not exists physical_street_line_2 text,
  add column if not exists physical_city text,
  add column if not exists physical_state text,
  add column if not exists physical_zip text;

-- --- Last U.S. entry --------------------------------------------------------
-- last_entry_date already exists (renamed from entry_date_us in part 3)
alter table public.applicants
  add column if not exists last_entry_status text,
  add column if not exists port_of_entry_city text,
  add column if not exists port_of_entry_state text,
  add column if not exists authorized_stay_expiration date,
  add column if not exists authorized_stay_is_duration_of_status boolean not null default false;

-- --- Most recent passport ---------------------------------------------------
-- passport_number, passport_country_of_issuance already exist
alter table public.applicants
  add column if not exists passport_expiration date,
  add column if not exists travel_document_number text;

-- --- Biographic (I-821 Part 3) ---------------------------------------------
alter table public.applicants
  add column if not exists ethnicity text,
  add column if not exists race text[] not null default '{}',
  add column if not exists height_feet smallint,
  add column if not exists height_inches smallint,
  add column if not exists weight_pounds smallint,
  add column if not exists eye_color text,
  add column if not exists hair_color text;

-- =============================================================================
-- PART 7: CHECK CONSTRAINTS
-- =============================================================================
-- All constraints accept NULL (form fills happen progressively).
-- We use CHECK constraints rather than Postgres ENUMs so we can amend the
-- allowed values via ALTER TABLE without the type-rename dance ENUMs require.

-- Sex (per USCIS forms — only Male/Female accepted)
alter table public.applicants drop constraint if exists applicants_sex_check;
alter table public.applicants add constraint applicants_sex_check
  check (sex is null or sex in ('male', 'female'));

-- Marital status (I-821 Part 2 Item 17 — superset of I-765's 4 options)
alter table public.applicants drop constraint if exists applicants_marital_status_check;
alter table public.applicants add constraint applicants_marital_status_check
  check (marital_status is null or marital_status in (
    'single_never_married',
    'married',
    'divorced',
    'widowed',
    'separated',
    'marriage_annulled',
    'other'
  ));

-- Ethnicity (I-821 Part 3 Item 1)
alter table public.applicants drop constraint if exists applicants_ethnicity_check;
alter table public.applicants add constraint applicants_ethnicity_check
  check (ethnicity is null or ethnicity in (
    'hispanic_or_latino',
    'not_hispanic_or_latino'
  ));

-- Eye color (I-821 Part 3 Item 5)
alter table public.applicants drop constraint if exists applicants_eye_color_check;
alter table public.applicants add constraint applicants_eye_color_check
  check (eye_color is null or eye_color in (
    'black', 'blue', 'brown', 'gray', 'green', 'hazel',
    'maroon', 'pink', 'unknown_other'
  ));

-- Hair color (I-821 Part 3 Item 6)
alter table public.applicants drop constraint if exists applicants_hair_color_check;
alter table public.applicants add constraint applicants_hair_color_check
  check (hair_color is null or hair_color in (
    'bald', 'black', 'blond', 'brown', 'gray', 'red',
    'sandy', 'white', 'unknown_other'
  ));

-- Race values (I-821 Part 3 Item 2 — multi-select)
-- Postgres CHECK can't constrain array element values cleanly with IN,
-- so we use a containment check against the allowed set.
alter table public.applicants drop constraint if exists applicants_race_check;
alter table public.applicants add constraint applicants_race_check
  check (race <@ array[
    'white',
    'asian',
    'black_or_african_american',
    'american_indian_or_alaska_native',
    'native_hawaiian_or_other_pacific_islander'
  ]::text[]);

-- A-Number format: 9 digits (USCIS pads short numbers with leading zeros).
-- Stored without the "A" prefix; UI adds it on display.
alter table public.applicants drop constraint if exists applicants_a_number_format_check;
alter table public.applicants add constraint applicants_a_number_format_check
  check (a_number is null or a_number ~ '^[0-9]{9}$');

-- SSN format: 9 digits, no dashes (UI handles display formatting).
alter table public.applicants drop constraint if exists applicants_ssn_format_check;
alter table public.applicants add constraint applicants_ssn_format_check
  check (ssn is null or ssn ~ '^[0-9]{9}$');

-- I-94 format: 11 alphanumeric characters.
alter table public.applicants drop constraint if exists applicants_i94_format_check;
alter table public.applicants add constraint applicants_i94_format_check
  check (i94_number is null or i94_number ~ '^[A-Z0-9]{11}$');

-- USCIS Online Account Number: 12 digits.
alter table public.applicants drop constraint if exists applicants_uscis_account_format_check;
alter table public.applicants add constraint applicants_uscis_account_format_check
  check (uscis_online_account_number is null or uscis_online_account_number ~ '^[0-9]{12}$');

-- Height sanity: feet 0-8, inches 0-11.
alter table public.applicants drop constraint if exists applicants_height_feet_check;
alter table public.applicants add constraint applicants_height_feet_check
  check (height_feet is null or (height_feet >= 0 and height_feet <= 8));

alter table public.applicants drop constraint if exists applicants_height_inches_check;
alter table public.applicants add constraint applicants_height_inches_check
  check (height_inches is null or (height_inches >= 0 and height_inches <= 11));

-- Weight sanity: 0-999 lbs (form has 3-digit field).
alter table public.applicants drop constraint if exists applicants_weight_check;
alter table public.applicants add constraint applicants_weight_check
  check (weight_pounds is null or (weight_pounds >= 0 and weight_pounds <= 999));

-- Date of birth sanity: not in the future, not unreasonably old.
alter table public.applicants drop constraint if exists applicants_dob_sanity_check;
alter table public.applicants add constraint applicants_dob_sanity_check
  check (
    date_of_birth is null
    or (date_of_birth <= current_date and date_of_birth >= '1900-01-01'::date)
  );

-- JSONB shape: other_names and other_dates_of_birth must be arrays.
alter table public.applicants drop constraint if exists applicants_other_names_is_array_check;
alter table public.applicants add constraint applicants_other_names_is_array_check
  check (jsonb_typeof(other_names) = 'array');

alter table public.applicants drop constraint if exists applicants_other_dobs_is_array_check;
alter table public.applicants add constraint applicants_other_dobs_is_array_check
  check (jsonb_typeof(other_dates_of_birth) = 'array');

-- =============================================================================
-- PART 8: INDEXES (selective, only where queries will benefit)
-- =============================================================================

-- Date of birth: useful for renewal alerts and age-based UI hints.
create index if not exists applicants_date_of_birth_idx on public.applicants (date_of_birth);

-- Country of birth: useful for filtering ("show me all Haiti TPS clients").
create index if not exists applicants_country_of_birth_idx on public.applicants (country_of_birth);

-- =============================================================================
-- PART 9: VENDOR ISOLATION TRIGGER FOR CHILD TABLES
-- =============================================================================
-- 009 created spouses, children, address_history, documents, forms with
-- vendor_id columns but did NOT enforce vendor_id matching the parent
-- applicant's vendor_id. RLS catches read mismatches but write-time bugs
-- could create orphaned rows. This trigger forces the relationship.

create or replace function public.enforce_applicant_vendor_match()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  parent_vendor_id uuid;
begin
  select vendor_id into parent_vendor_id
    from public.applicants
    where id = NEW.client_id;

  if parent_vendor_id is null then
    raise exception 'Applicant % does not exist', NEW.client_id;
  end if;

  if NEW.vendor_id is distinct from parent_vendor_id then
    raise exception 'vendor_id mismatch: row vendor_id % does not match applicant vendor_id %',
      NEW.vendor_id, parent_vendor_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists spouses_enforce_vendor_match on public.spouses;
create trigger spouses_enforce_vendor_match
  before insert or update on public.spouses
  for each row execute function public.enforce_applicant_vendor_match();

drop trigger if exists children_enforce_vendor_match on public.children;
create trigger children_enforce_vendor_match
  before insert or update on public.children
  for each row execute function public.enforce_applicant_vendor_match();

drop trigger if exists address_history_enforce_vendor_match on public.address_history;
create trigger address_history_enforce_vendor_match
  before insert or update on public.address_history
  for each row execute function public.enforce_applicant_vendor_match();

drop trigger if exists documents_enforce_vendor_match on public.documents;
create trigger documents_enforce_vendor_match
  before insert or update on public.documents
  for each row execute function public.enforce_applicant_vendor_match();

drop trigger if exists forms_enforce_vendor_match on public.forms;
create trigger forms_enforce_vendor_match
  before insert or update on public.forms
  for each row execute function public.enforce_applicant_vendor_match();

-- =============================================================================
-- END OF MIGRATION 010
-- =============================================================================