// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Shown to an Adult Member who has been offered the Family Head role (FH-3). Accepting refreshes the
// session so the Family Head portal opens without signing in again.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { familyLifecycleApi, refreshSession, type HeadTransferDto } from '../../services/apiClient'
import { useAppDispatch } from '../../store/hooks'
import { mapAuthResponse, signedIn } from '../../store/slices/authSlice'
import { extractErrorMessage } from './threePortalUtils'

export function HeadTransferBanner() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [offer, setOffer] = useState<HeadTransferDto | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    familyLifecycleApi
      .getIncomingHeadTransfer()
      .then(({ data }) => active && setOffer(data || null))
      .catch(() => active && setOffer(null)) // optional banner; never block the page
    return () => {
      active = false
    }
  }, [])

  if (!offer && !message) return null

  async function respond(accept: boolean) {
    if (!offer) return
    setBusy(true)
    try {
      if (accept) {
        await familyLifecycleApi.acceptHeadTransfer(offer.id)
        const session = await refreshSession()
        if (session) dispatch(signedIn(mapAuthResponse(session)))
        setOffer(null)
        setMessage(`You are now the Family Head of ${offer.familyName}.`)
        navigate('/dashboard')
      } else {
        await familyLifecycleApi.declineHeadTransfer(offer.id)
        setOffer(null)
        setMessage('You declined the Family Head role.')
      }
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Your answer could not be saved. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="status-banner" role="region" aria-label="Family Head offer">
      {offer ? (
        <div className="inline-actions">
          <span>
            <b>{offer.fromDisplayName}</b> asked you to become the Family Head of <b>{offer.familyName}</b>. You would manage
            members, minors and the family doctor. Your own health data stays private.
          </span>
          <button className="button button--primary" type="button" disabled={busy} onClick={() => void respond(true)}>
            Accept
          </button>
          <button className="button button--secondary" type="button" disabled={busy} onClick={() => void respond(false)}>
            Decline
          </button>
        </div>
      ) : (
        <span role="status">{message}</span>
      )}
    </section>
  )
}
