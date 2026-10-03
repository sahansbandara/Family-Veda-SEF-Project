// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Member workspace tabs for the doctor's own data about a member: Visits and Notes.
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import type { ClinicalNoteDto, MemberWorkspaceDto } from '../../services/apiClient'
import { FriendlyStatusBadge } from '../family/threePortalShared'
import { formatDateTime } from '../family/threePortalUtils'
import { Empty, Icon, Pill, Strip } from './familyParts'
import { splitVisits, type WorkspaceVisit } from './familyWorkspace'

const NOTE_MAX = 4000

function VisitList({ title, visits }: { title: string; visits: WorkspaceVisit[] }) {
  if (visits.length === 0) return null
  return (
    <>
      <h3 className="dfam-sub">{title}</h3>
      <div className="dfam-stack">
        {visits.map((visit) => (
          <article className="dfam-visit" key={visit.appointmentId}>
            <div><b>{formatDateTime(visit.startsAt)}</b><span>{visit.reason}</span></div>
            <FriendlyStatusBadge status={visit.status} />
          </article>
        ))}
      </div>
    </>
  )
}

export function VisitsTab({ visits }: { visits: MemberWorkspaceDto['visits'] }) {
  const { upcoming, past } = splitVisits(visits, Date.now())
  return (
    <>
      <div className="dfam-section-head">
        <div><h2>Visits with you</h2><p>Appointments between you and this member.</p></div>
        <Link className="dfam-btn" to="/calendar"><Icon name="calendar" /> Open Calendar</Link>
      </div>
      {visits.length === 0 ? <Empty title="No visits yet" message="Appointments this member books with you appear here." /> : (
        <>
          <VisitList title="Upcoming" visits={upcoming} />
          <VisitList title="Past" visits={past} />
        </>
      )}
      <p className="dfam-note">A booked visit does not open the member's records by itself. Access follows the time-bound visit grant and the member's consent.</p>
    </>
  )
}

export function NotesTab({ notes, canWrite, onSave }: {
  notes: ClinicalNoteDto[]
  canWrite: boolean
  /** Resolves true when the note was saved, so the form can clear. */
  onSave: (content: string, amendsNoteId: string | null) => Promise<boolean>
}) {
  const [content, setContent] = useState('')
  const [amending, setAmending] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const text = content.trim()
    if (!text || saving) return
    setSaving(true)
    if (await onSave(text, amending)) {
      setContent('')
      setAmending(null)
    }
    setSaving(false)
  }

  return (
    <>
      <div className="dfam-section-head">
        <div><h2>Doctor-only clinical notes</h2><p>Never shown to the patient or the family. Amendments keep every earlier version.</p></div>
        <Pill>{notes.length} {notes.length === 1 ? 'entry' : 'entries'}</Pill>
      </div>
      <div className={canWrite ? 'dfam-notes' : 'dfam-stack'}>
        {canWrite ? (
          <form className="dfam-noteform" onSubmit={(event) => void submit(event)}>
            <label htmlFor="dfam-note-content">{amending ? 'Amendment (the original note is kept)' : 'New visit note'}</label>
            <textarea id="dfam-note-content" required maxLength={NOTE_MAX} rows={5} value={content} placeholder="Document relevant observations and decision rationale…" onChange={(event) => setContent(event.target.value)} />
            <div className="dfam-noteform__foot">
              <span className="dfam-note">{content.length} / {NOTE_MAX} characters · Append-only history</span>
              <div className="dfam-actions">
                {amending && <button className="dfam-btn" type="button" disabled={saving} onClick={() => setAmending(null)}>Cancel</button>}
                <button className="dfam-btn dfam-btn--primary" type="submit" disabled={saving || !content.trim()}>{saving ? 'Saving…' : amending ? 'Save amendment' : 'Save note'}</button>
              </div>
            </div>
          </form>
        ) : <Strip icon="lock">Notes can be added or amended only during an active visit or shared case for this member. Your earlier notes stay readable below.</Strip>}
        <div className="dfam-stack">
          <h3 className="dfam-sub">Note history</h3>
          {notes.length === 0 ? <Empty title="No notes" message="Your notes about this member appear here. They are never shown to the family." /> : notes.map((note) => (
            <article className="dfam-noteentry" key={note.id}>
              <div className="dfam-card__top">
                <div><b>{formatDateTime(note.createdAt)}</b><p className="dfam-note">{note.version > 1 ? `Amendment v${note.version}` : 'Original note'} · Doctor-only</p></div>
                {canWrite && (
                  <button className="dfam-btn" type="button" aria-label={`Amend note from ${formatDateTime(note.createdAt)}`} onClick={() => { setAmending(note.amendsNoteId ?? note.id); document.getElementById('dfam-note-content')?.focus() }}>
                    <Icon name="edit" size={14} /> Amend
                  </button>
                )}
              </div>
              <p>{note.content}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
