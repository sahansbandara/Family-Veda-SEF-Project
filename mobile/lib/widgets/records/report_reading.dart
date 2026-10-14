// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Patient-facing copy for why a report could not be read. Describes the file,
// never the patient's health (RULE 1). Mirrors web/src/components/records/reportReading.ts.

class ReadingFailure {
  const ReadingFailure(this.title, this.detail, this.tips);
  final String title;
  final String detail;
  final List<String> tips;
}

const _clearerCopy =
    'Upload a clearer copy: flat, well lit, the whole page in frame.';
const _manualEntry = 'Or add the values yourself under Records.';

const _reasons = <String, ReadingFailure>{
  'REPORT_TOO_MANY_PAGES': ReadingFailure(
    'Report is longer than 4 pages',
    'Only reports of up to 4 pages can be read automatically.',
    ['Upload only the pages that show the test results.', _manualEntry],
  ),
  'REPORT_TOO_MUCH_TEXT': ReadingFailure(
    'Report has too much text',
    'The report contains more text than can be read safely in one go.',
    ['Upload only the pages that show the test results.', _manualEntry],
  ),
  'NO_VALUES_FOUND': ReadingFailure(
    'No test results found',
    'Text was read, but no rows with a test name, a number and a unit were '
        'found. Handwritten, blurred or tilted reports often cause this.',
    [
      _clearerCopy,
      'Make sure the results table is fully visible and not cut off.',
      _manualEntry,
    ],
  ),
  'OCR_UNREADABLE': ReadingFailure(
    'Text could not be read',
    'The image is too blurred, dark or low-resolution to read any text.',
    [_clearerCopy, 'A PDF from the laboratory reads best.', _manualEntry],
  ),
  'OCR_TIMEOUT': ReadingFailure(
    'Reading took too long',
    'The report is very large or detailed, and reading it timed out.',
    [
      'Retry once. If it fails again, upload a smaller or cropped copy.',
      _manualEntry,
    ],
  ),
  'OCR_INTERRUPTED': ReadingFailure(
    'Reading was interrupted',
    'The service restarted while this report was being read. Nothing is '
        'wrong with your file.',
    ['Select Read again.'],
  ),
  'OCR_CANCELLED': ReadingFailure(
    'Reading was interrupted',
    'The reading was stopped before it finished. Nothing is wrong with your '
        'file.',
    ['Select Read again.'],
  ),
  'PDF_UNSUPPORTED': ReadingFailure(
    'PDF could not be opened',
    'This PDF could not be opened for reading. It may be protected or '
        'damaged.',
    ['Upload a photo or a PNG/JPEG export of the result pages.', _manualEntry],
  ),
  'OCR_ENGINE_UNAVAILABLE': ReadingFailure(
    'Reading service unavailable',
    'The reading service is not available right now. Nothing is wrong with '
        'your file.',
    ['Try again in a few minutes.'],
  ),
};

ReadingFailure readingFailure(String? code) =>
    _reasons[code] ??
    const ReadingFailure(
      'Report could not be read',
      'Automatic reading did not finish for this report.',
      ['Select Read again.', _clearerCopy, _manualEntry],
    );
