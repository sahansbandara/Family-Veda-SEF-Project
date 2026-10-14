// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
// Patient-facing copy for why a report could not be read. Describes the file, never the patient's health (RULE 1).
export type ReadingFailure = { title: string; detail: string; tips: string[] }

const clearerCopy = 'Upload a clearer copy: flat, well lit, the whole page in frame.'
const manualEntry = 'Or add the values yourself under Records.'

const reasons: Record<string, ReadingFailure> = {
  REPORT_TOO_MANY_PAGES: { title: 'Report is longer than 4 pages', detail: 'Only reports of up to 4 pages can be read automatically.', tips: ['Upload only the pages that show the test results.', manualEntry] },
  REPORT_TOO_MUCH_TEXT: { title: 'Report has too much text', detail: 'The report contains more text than can be read safely in one go.', tips: ['Upload only the pages that show the test results.', manualEntry] },
  NO_VALUES_FOUND: { title: 'No test results found', detail: 'Text was read, but no rows with a test name, a number and a unit were found. Handwritten, blurred or tilted reports often cause this.', tips: [clearerCopy, 'Make sure the results table is fully visible and not cut off.', manualEntry] },
  OCR_UNREADABLE: { title: 'Text could not be read', detail: 'The image is too blurred, dark or low-resolution to read any text.', tips: [clearerCopy, 'A PDF from the laboratory reads best.', manualEntry] },
  OCR_TIMEOUT: { title: 'Reading took too long', detail: 'The report is very large or detailed, and reading it timed out.', tips: ['Retry once. If it fails again, upload a smaller or cropped copy.', manualEntry] },
  OCR_INTERRUPTED: { title: 'Reading was interrupted', detail: 'The service restarted while this report was being read. Nothing is wrong with your file.', tips: ['Select Read again.'] },
  OCR_CANCELLED: { title: 'Reading was interrupted', detail: 'The reading was stopped before it finished. Nothing is wrong with your file.', tips: ['Select Read again.'] },
  PDF_UNSUPPORTED: { title: 'PDF could not be opened', detail: 'This PDF could not be opened for reading. It may be protected or damaged.', tips: ['Upload a photo or a PNG/JPEG export of the result pages.', manualEntry] },
  OCR_ENGINE_UNAVAILABLE: { title: 'Reading service unavailable', detail: 'The reading service is not available right now. Nothing is wrong with your file.', tips: ['Try again in a few minutes.'] },
}

export function readingFailure(code?: string | null): ReadingFailure {
  return reasons[code ?? ''] ?? { title: 'Report could not be read', detail: 'Automatic reading did not finish for this report.', tips: ['Select Read again.', clearerCopy, manualEntry] }
}
