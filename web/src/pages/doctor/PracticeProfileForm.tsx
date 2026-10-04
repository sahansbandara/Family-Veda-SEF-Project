// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// The editable practice profile. Collects input only; DoctorProfilePage owns the API call.
// Name, email, SLMC number and verification status are shown by the page and are never sent.
import { type FormEvent, useId, useState } from 'react'

import type { DoctorPracticeProfileDto, UpdatePracticeProfileRequest } from '../../services/apiClient'
import { Switch } from './doctorProfileParts'
import {
  citiesFor, CONSULTATION_MODES, DISTRICTS, HOSPITAL_OPTIONS, joinChoices, LANGUAGES, MODE_ALIASES, parseChoices,
  phoneProblem, SLOT_MINUTES, SPECIALIZATIONS,
} from './practiceOptions'
import { Combo, MultiSelect } from './practiceSelectors'

const draftOf = (profile: DoctorPracticeProfileDto) => ({
  specialty: profile.specialty ?? '',
  clinic: profile.clinic ?? '',
  district: profile.district ?? '',
  city: profile.city ?? '',
  languages: parseChoices(profile.languages, LANGUAGES),
  modes: parseChoices(profile.consultationModes, CONSULTATION_MODES, MODE_ALIASES),
  phoneNumber: profile.phoneNumber ?? '',
  slotMinutes: profile.slotMinutes,
  accepting: profile.acceptingNewFamilies,
})
type Draft = ReturnType<typeof draftOf>

export function PracticeProfileForm({ profile, onSave }: {
  profile: DoctorPracticeProfileDto
  onSave: (update: UpdatePracticeProfileRequest) => Promise<void>
}) {
  const id = useId()
  const [draft, setDraft] = useState<Draft>(() => draftOf(profile))
  const [cityCleared, setCityCleared] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // Every change patches one field, so editing one control never resets another.
  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }))

  function changeDistrict(district: string) {
    // A city belongs to one district: keep it only if the new district lists it.
    const keep = !draft.city || citiesFor(district).includes(draft.city)
    setCityCleared(!keep)
    set({ district, city: keep ? draft.city : '' })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = phoneProblem(draft.phoneNumber)
    setPhoneError(problem)
    if (problem) return document.getElementById(`${id}-phone`)?.focus()
    const text = (value: string) => value.trim() || null
    setSaving(true)
    try {
      await onSave({
        specialty: text(draft.specialty), clinic: text(draft.clinic), district: text(draft.district), city: text(draft.city),
        languages: joinChoices(draft.languages), consultationModes: joinChoices(draft.modes), phoneNumber: text(draft.phoneNumber),
        slotMinutes: draft.slotMinutes, acceptingNewFamilies: draft.accepting,
      })
    } finally {
      setSaving(false)
    }
  }

  const districtListed = !draft.district || (DISTRICTS as readonly string[]).includes(draft.district)

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <fieldset className="dprof-group">
        <legend>Professional details</legend>
        <div className="dprof-grid">
          <Combo label="Specialty" value={draft.specialty} onChange={(specialty) => set({ specialty })}
            options={SPECIALIZATIONS} placeholder="Search or select" maxLength={120} />
          <Combo label="Hospital / Clinic" value={draft.clinic} onChange={(clinic) => set({ clinic })}
            options={HOSPITAL_OPTIONS} placeholder="Search or enter a name" customLabel="Not listed — use" maxLength={120}
            hint="Shown as you enter it. Family Veda does not verify this affiliation." />
        </div>
      </fieldset>

      <fieldset className="dprof-group">
        <legend>Location</legend>
        <div className="dprof-grid">
          <label className="dprof-field">District
            <select value={draft.district} onChange={(event) => changeDistrict(event.target.value)}>
              <option value="">Select district</option>
              {!districtListed && <option value={draft.district}>{draft.district} (saved value)</option>}
              {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </label>
          <Combo label="City" value={draft.city} onChange={(city) => { setCityCleared(false); set({ city }) }}
            options={citiesFor(draft.district).map((value) => ({ value }))}
            placeholder={draft.district ? `Search in ${draft.district} or enter a city` : 'Select a district, or enter a city'}
            customLabel="City not listed — use" maxLength={60}
            hint={cityCleared ? <span role="status">City cleared because the district changed. Choose a city in {draft.district}.</span> : undefined} />
        </div>
      </fieldset>

      <fieldset className="dprof-group">
        <legend>Consultation preferences</legend>
        <div className="dprof-grid">
          <MultiSelect label="Languages spoken" values={draft.languages} onChange={(languages) => set({ languages })}
            options={LANGUAGES} placeholder="Select languages" />
          <MultiSelect label="Consultation modes" values={draft.modes} onChange={(modes) => set({ modes })}
            options={CONSULTATION_MODES} placeholder="Select modes"
            hint="Video and phone consultations cannot be booked in Family Veda yet." />
        </div>
      </fieldset>

      <fieldset className="dprof-group">
        <legend>Contact &amp; scheduling</legend>
        <div className="dprof-grid">
          <div className="dprof-field">
            <label htmlFor={`${id}-phone`}>Professional phone</label>
            <input id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="tel" maxLength={32} placeholder="e.g. 0112345678"
              value={draft.phoneNumber} aria-invalid={phoneError ? true : undefined} aria-describedby={phoneError ? `${id}-phone-error` : undefined}
              onChange={(event) => { setPhoneError(null); set({ phoneNumber: event.target.value }) }} />
            {phoneError && <small className="dprof-hint dprof-hint--error" id={`${id}-phone-error`} role="alert">{phoneError}</small>}
          </div>
          <label className="dprof-field">Appointment length
            <select value={draft.slotMinutes} onChange={(event) => set({ slotMinutes: Number(event.target.value) })}>
              {SLOT_MINUTES.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <div className="dprof-switchline">
        <div><b>Accepting new families</b><small>Allow new families to request you as their primary doctor.</small></div>
        <div className="dprof-switchline__control">
          <span aria-hidden="true">{draft.accepting ? 'On' : 'Off'}</span>
          <Switch label="Accepting new families" checked={draft.accepting} onChange={(event) => set({ accepting: event.target.checked })} />
        </div>
      </div>
      <div className="dprof-actions">
        <button className="dprof-btn dprof-btn--primary" type="submit" disabled={saving} aria-busy={saving}>
          {saving ? 'Saving…' : 'Save profile changes'}
        </button>
      </div>
    </form>
  )
}
