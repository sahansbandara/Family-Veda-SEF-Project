import type { ReactNode } from 'react'
const paths: Record<string, ReactNode> = {
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  minus: <path d="M5 12h14" />, plus: <path d="M5 12h14M12 5v14" />,
  rotate: <path d="M20 7V3m0 4h-4M20 7a9 9 0 1 0 1 8" />,
  reset: <path d="M4 7V3m0 4h4M4 7a9 9 0 1 1-1 8" />,
  fit: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5" />,
  width: <path d="M3 4v16M21 4v16M5 12h14m-4-4 4 4-4 4M9 8l-4 4 4 4" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" /></>,
  moon: <path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  file: <path d="M14 2H5v20h14V7l-5-5v5h5M8 12h8M8 16h8" />,
  scan: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M7 8h10M7 12h10M7 16h6" />,
  left: <path d="m14 6-6 6 6 6" />, right: <path d="m10 6 6 6-6 6" />,
  pages: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></>,
}
export function ViewerIcon({ name }: { name: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>
}
