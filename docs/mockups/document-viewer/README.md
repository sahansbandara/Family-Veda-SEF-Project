# Family Veda document viewer — refined design

Design artifact, 11 October 2026. Based on the supplied interactive HTML, redesign specification and OneDrive reference. Production code is unchanged.

## Direction

Refined clinical workspace: quiet navy shell, original white paper, restrained blue selected states and a floating navigation dock. Avenir Next with a local fallback; no remote fonts or scripts. Document identity replaces the generic “Original report” heading. Details closed by default. One document canvas replaces nested cards. Design feasibility: 13/15 (impact 4, context 5, feasibility 5, performance 4, consistency risk 5).

## Changes to make in the app

1. Reuse OriginalReportDialog as a near-full-screen reusable viewer shell, preserving focus return, Escape and permission-controlled file retrieval.
2. Separate file identity and actions from OriginalReportPreview rendering. Keep authorized original Blob bytes; never substitute prototype HTML or extracted values.
3. PdfReportCanvas: page navigation, actual rendered thumbnails, current page tracking, fit width/page, stable canvas during rerenders, cancel stale renders. Bound thumbnail render work and reuse the existing bundled PDF.js worker.
4. ImageReportCanvas: retain aspect ratio, zoom, rotation and reachable scroll bounds. Start fit-to-page with fit-to-width one click away. Do not apply a maximum image height that contradicts computed dimensions.
5. Replace text buttons with matching existing line icons and accessible labels: X close; download; minus/plus; scan/rectangle fit; rotate-cw; refresh-ccw reset; panel-left pages; info details; maximize fullscreen; external-link open original; ellipsis secondary actions. Each has tooltip, focus style and disabled state. Keep the zoom percentage readable.
6. Desktop: collapsible PDF rail, central canvas, optional details rail. Tablet: collapse rails before shrinking the document. Phone: full screen, filename + download/details/more, 44 px controls, bottom page/zoom dock; secondary actions and rails become sheets.
7. Native Flutter: adapt the existing PDF viewer and InteractiveViewer screen with native app bar, SafeArea, bottom controls and sheets. HTML prototype is a web design reference, not a completed native screen.
8. Preserve loading/error/revoked-access messages, original downloads and grant/consent enforcement. No new sharing permissions, backend rewrite, extraction change or database migration is required.

## Prototype interactions

PDF/image switch, page thumbnails/navigation, scroll-linked page indicator, zoom presets/steps, fit width/page, rotation, reset, details, mobile page sheet, more actions, fullscreen layout, Escape/focus return and embedded synthetic original downloads. PDF page layout and thumbnails are illustrative HTML, not a production PDF renderer. Sample permission state is illustrative. Pinch/pan, native gestures and real authorization must be tested in production implementation.

## Verification

Browser layouts checked at 320, 375, 390, 768 and 1440 px. No body horizontal overflow in tested phone/tablet sizes. PDF navigation, image-specific control hiding, image load, fit and modal closure tested. Screenshots cover desktop PDF/image and 390 px PDF/image. Native Android/iOS and real API integration are not implemented or verified by this design artifact.

## Implementation approval plan

Scope: existing React dialog/preview/renderers and scoped styles/tests, and existing Flutter original-report viewer/tests. Keep APIs and original bytes unchanged. Test fit/rotation/resizing without the earlier flicker loop; test focus, page controls and image-only control visibility. Verify desktop, 375/390/768 px, Android and iOS (or report tool/device blockers). No dependency/lock changes without a separate decision. This plan awaits design approval before production implementation.

## Check report again
Member More menu includes scan-text + Check report again for PDFs and images. Prototype simulates loading, extracted-value review, and failure preserving previous values. Doctor scenario hides retry; confirmed reports and unsaved edits disable it with reasons. Production must reuse authorized member/guardian retry and Health records confirmation; no automatic confirmation. Scenario selector is prototype-only.

## Light and dark modes
Sun/moon toolbar toggle changes the viewer shell, controls and background. Original PDF/image colours stay unchanged. PDF/image theme switching checked in the browser. No production integration, API connection or native device validation is included.
