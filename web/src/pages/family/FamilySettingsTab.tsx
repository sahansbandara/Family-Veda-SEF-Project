// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Family Settings tab: rename the family and share the Family Code. The code identifies the family for
// a join request; it never grants access by itself.
import { type FormEvent, useState } from 'react'

import { familyLifecycleApi, type FamilyDto } from '../../services/apiClient'
import { extractErrorMessage } from './threePortalUtils'

type Props = { family: FamilyDto; onChanged: () => Promise<void>; onMessage: (message: string) => void }

export function FamilySettingsTab({ family, onChanged, onMessage }: Props) {
  const [isSaving, setIsSaving] = useState(false)

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get('name') || '').trim()
    if (name.length < 2) return onMessage('The family name needs at least 2 characters.')
    setIsSaving(true)
    try {
      await familyLifecycleApi.renameFamily(family.id, name)
      onMessage('Family name saved.')
      await onChanged()
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The family name could not be saved.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function copyCode() {
    if (!family.familyCode) return
    try {
      await navigator.clipboard.writeText(family.familyCode)
      onMessage('Family Code copied.')
    } catch {
      onMessage(`Copy failed. Your Family Code is ${family.familyCode}.`)
    }
  }

  return (
    <section className="panel" aria-label="Family settings">
      <p className="eyebrow">Family lifecycle</p>
      <h2>Family Settings</h2>
      <form className="form-grid" onSubmit={(event) => void rename(event)}>
        <label>
          Family name
          <input name="name" defaultValue={family.name} required minLength={2} maxLength={120} />
        </label>
        <button className="button button--primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save name'}
        </button>
      </form>

      <div className="form-grid">
        <label>
          Family Code
          <input className="family-code" readOnly value={family.familyCode ?? 'Not assigned'} />
        </label>
        <button className="button button--secondary" type="button" onClick={() => void copyCode()} disabled={!family.familyCode}>
          Copy code
        </button>
      </div>
      <p className="muted">Share the code with an adult who should request to join. You still accept or decline every request.</p>
    </section>
  )
}
