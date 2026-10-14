// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Reusable auth hero panel. Import in AuthPage (S1) and DoctorRegisterPage (S4).

export interface AuthHeroProps {
  /** Absolute or relative URL to the background image */
  imageSrc: string
  /** Alt text for the background (decorative — set empty for purely decorative images) */
  imageAlt?: string
  /** Logo image URL */
  logoSrc: string
  /** Primary headline shown over the image */
  headline: string
  /** Supporting sub-copy */
  subline?: string
}

export function AuthHero({ imageSrc, imageAlt = '', logoSrc, headline, subline }: AuthHeroProps) {
  return (
    <div className="auth-hero" aria-hidden="true">
      {/* Background image */}
      <div
        className="auth-hero-bg"
        role="img"
        aria-label={imageAlt}
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      {/* Gradient overlay */}
      <div className="auth-hero-overlay" />
      {/* Content */}
      <div className="auth-hero-content">
        <div className="auth-hero-logo">
          <img src={logoSrc} alt="FamilyVeda logo" width={44} height={44} />
          <span className="auth-hero-logo-name">FamilyVeda</span>
        </div>
        <h1 className="auth-hero-headline">{headline}</h1>
        {subline && <p className="auth-hero-sub">{subline}</p>}
      </div>
    </div>
  )
}
