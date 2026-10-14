// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// What a doctor can do after acknowledging an emergency referral: book a follow-up, share their
// contact number, or close the referral. The backend checks the case grant on every call; nothing
// here releases AI output or changes the referral the patient was given.
import { useState } from 'react'

import { apiClient } from '../../services/apiClient'
import { followUpError } from './triageQueue'

type Mode = 'idle' | 'book' | 'share' | 'close'
type EmergencyFollowUpProps = {
  caseId: string
  caseRef: string
  /** Called after a saved action with a sentence describing what happened. */
  onDone: (message: string) => void
}

const DURATIONS = [15, 30, 45, 60]
const DEFAULT_REASON = 'Follow-up after urgent care referral'

/** Earliest value the date-time field accepts: now, in the browser's local time. */
function localNow(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function EmergencyFollowUp({ caseId, caseRef, onDone }: EmergencyFollowUpProps) {
  const [mode, setMode] = useState<Mode>('idle')
  const [startsAt, setStartsAt] = useState('')
  const [duration, setDuration] = useState(30)
  const [reason, setReason] = useState(DEFAULT_REASON)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function open(next: Mode) {
    setError('')
    setMode(next)
  }

  async function run(request: () => Promise<unknown>, done: string, fallback: string) {
    setSaving(true)
    setError('')
    try {
      await request()
      setMode('idle')
      onDone(done)
    } catch (failure) {
      setError(followUpError(failure, fallback))
    } finally {
      setSaving(false)
    }
  }

  function book() {
    const when = new Date(startsAt)
    if (!startsAt || Number.isNaN(when.valueOf())) {
      setError('Choose a date and time for the appointment.')
      return
    }
    if (when.valueOf() <= Date.now()) {
      setError('Choose a time in the future.')
      return
    }
    void run(
      () =>
        apiClient.post(`/triage-cases/${caseId}/appointments`, {
          startsAt: when.toISOString(),
          durationMinutes: duration,
          reason: reason.trim() || null,
        }),
      `Follow-up appointment booked for case ${caseRef}. The patient was notified and can cancel it.`,
      'The appointment was not booked. Nothing was changed. Try again.',
    )
  }

  return (
    <section className="triage-followup" aria-label="Follow-up actions">
      {error ? (
        <p className="care-note care-note--warning" role="alert">
          {error}
        </p>
      ) : null}

      {mode === 'idle' ? (
        <>
          <button type="button" className="button button--primary" onClick={() => open('book')}>
            Book Follow-up Appointment
          </button>
          <button type="button" className="button button--secondary" onClick={() => open('share')}>
            Share My Contact Number
          </button>
          <button type="button" className="button button--secondary" onClick={() => open('close')}>
            Mark Referral Closed
          </button>
        </>
      ) : null}

      {mode === 'book' ? (
        <form
          className="triage-followup__form"
          onSubmit={(event) => {
            event.preventDefault()
            book()
          }}
        >
          <label className="field">
            <span>Date and time</span>
            <input
              type="datetime-local"
              value={startsAt}
              min={localNow()}
              required
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Duration</span>
            <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Reason shown to the patient</span>
            <input type="text" value={reason} maxLength={200} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="care-caption">
            The appointment is confirmed at once and the patient can cancel it. It does not give you access to the
            patient's records.
          </p>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? 'Booking…' : 'Confirm Appointment'}
          </button>
          <button type="button" className="button button--secondary" disabled={saving} onClick={() => open('idle')}>
            Cancel
          </button>
        </form>
      ) : null}

      {mode === 'share' ? (
        <div className="triage-followup__form">
          <p className="care-caption">
            Sends the phone number on your profile to this patient, with a reminder that it does not replace urgent
            in-person care. This cannot be undone.
          </p>
          <button
            type="button"
            className="button button--primary"
            disabled={saving}
            onClick={() =>
              void run(
                () => apiClient.post(`/triage-cases/${caseId}/share-contact`),
                `Your contact number was sent to the patient for case ${caseRef}.`,
                'Your contact was not shared. Nothing was changed. Try again.',
              )
            }
          >
            {saving ? 'Sending…' : 'Send My Number'}
          </button>
          <button type="button" className="button button--secondary" disabled={saving} onClick={() => open('idle')}>
            Cancel
          </button>
        </div>
      ) : null}

      {mode === 'close' ? (
        <div className="triage-followup__form">
          <p className="care-caption">
            Closing removes this referral from the Emergency queue for every doctor. The patient still sees the
            referral to in-person care. This cannot be undone.
          </p>
          <button
            type="button"
            className="button button--primary"
            disabled={saving}
            onClick={() =>
              void run(
                () => apiClient.post(`/triage-cases/${caseId}/close-referral`),
                `Referral ${caseRef} closed. It moved to Completed. The patient still sees the referral to in-person care.`,
                'The referral was not closed. Nothing was changed. Try again.',
              )
            }
          >
            {saving ? 'Closing…' : 'Close Referral'}
          </button>
          <button type="button" className="button button--secondary" disabled={saving} onClick={() => open('idle')}>
            Cancel
          </button>
        </div>
      ) : null}
    </section>
  )
}
