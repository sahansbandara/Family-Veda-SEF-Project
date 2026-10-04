import { Link, useLocation } from 'react-router-dom'
import loginBg from '../../assets/Loging.webp'
import '../../styles/commercial-auth.css'
import '../../styles/public-information.css'

type PageKind = 'about' | 'privacy' | 'terms'

const pageContent: Record<PageKind, { eyebrow: string; title: string; lead: string; sections: Array<{ title: string; paragraphs: string[] }> }> = {
  about: {
    eyebrow: 'SE3090 university prototype',
    title: 'About Family Veda',
    lead: 'Family Veda is a synthetic-data prototype for learning and demonstrating family health-record workflows.',
    sections: [
      { title: 'What this prototype does', paragraphs: ['It brings together family health records, consent-aware sharing, doctor review and educational decision-support workflows. All examples, accounts and records in the prototype are synthetic.'] },
      { title: 'How automated support is used', paragraphs: ['The hosted architecture uses Gemini as the primary provider and Groq as a fallback. Automated output is treated as untrusted input and is subject to validation. Doctor approval and backend consent rules remain in control of patient-data access.'] },
      { title: 'Important safety notice', paragraphs: ['Family Veda provides educational information only. It does not provide a clinical diagnosis, prescription, medication dosing or meal plan. If there is an emergency or urgent concern, seek immediate care from local emergency services or a qualified healthcare professional.'] },
    ],
  },
  privacy: {
    eyebrow: 'Privacy policy',
    title: 'Privacy and data use',
    lead: 'This policy describes the data handling of the Family Veda university prototype.',
    sections: [
      { title: 'Synthetic information only', paragraphs: ['This prototype is designed for synthetic information only. Do not enter real patient data, national identity numbers or professional registration numbers.'] },
      { title: 'Storage and service providers', paragraphs: ['When configured, the prototype uses Vercel, Render and Neon for its web, API and database services. Original report files may be stored in a private Google Drive location configured for the application.'] },
      { title: 'Consent and access', paragraphs: ['The backend enforces consent and doctor approval rules for relevant workflows. Revoking access stops future access through the application; it does not promise deletion of original files or records already stored by configured services.'] },
      { title: 'Prototype limits', paragraphs: ['This page is an educational transparency notice for the assignment prototype. It does not make retention, deletion or clinical-care guarantees.'] },
    ],
  },
  terms: {
    eyebrow: 'Terms of service',
    title: 'Terms for using Family Veda',
    lead: 'Use Family Veda only as a synthetic SE3090 university prototype.',
    sections: [
      { title: 'Permitted use', paragraphs: ['Use only synthetic identities and synthetic health information. You must not upload or rely on real patient data, real identity numbers or real professional registration numbers.'] },
      { title: 'Clinical boundaries', paragraphs: ['Family Veda is educational support, not medical care. It does not provide a diagnosis, prescription, medication dosing or meal plan. Seek urgent or emergency care from appropriate local services and qualified professionals.'] },
      { title: 'Access and approval', paragraphs: ['Access is governed by backend consent checks and doctor approval where the workflow requires it. Viewing these terms does not accept them or create an account. Registration requires a separate, explicit acceptance action.'] },
      { title: 'Service availability', paragraphs: ['The prototype may use hosted Gemini and Groq AI providers, Vercel, Render, Neon and private Google Drive storage when configured. Availability and storage are subject to those configured services.'] },
    ],
  },
}

function pageKind(pathname: string): PageKind {
  if (pathname === '/privacy-policy') return 'privacy'
  if (pathname === '/terms') return 'terms'
  return 'about'
}

export function PublicInformationPage() {
  const page = pageContent[pageKind(useLocation().pathname)]

  return (
    <main className="auth-page-root" style={{ backgroundImage: \`url(\${loginBg})\` }}>
      <div className="auth-overlay"></div>
      <div className="auth-main-container public-glass-container">
        <div className="auth-glass-panel public-glass-panel">
          
          <header className="public-glass-header">
            <Link to="/about" className="public-glass-brand">Family Veda</Link>
            <nav aria-label="Public information" className="public-glass-nav">
              <Link to="/about" className="public-glass-link">About</Link>
              <Link to="/privacy-policy" className="public-glass-link">Privacy</Link>
              <Link to="/terms" className="public-glass-link">Terms</Link>
              <Link to="/login" className="public-glass-signin">Sign in</Link>
            </nav>
          </header>

          <div className="public-glass-scroll">
            <article>
              <p className="public-glass-eyebrow">{page.eyebrow}</p>
              <h1 className="public-glass-title">{page.title}</h1>
              <p className="public-glass-lead">{page.lead}</p>
              
              {page.sections.map((section) => (
                <section key={section.title} className="public-glass-section">
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </article>
          </div>

        </div>
      </div>
    </main>
  )
}
