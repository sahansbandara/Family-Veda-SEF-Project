// S2 · Real report states, without invented percentages or clinical interpretation.
export function ReportProgress({ status, confirmed = false }: { status: string; confirmed?: boolean }) {
  const failed = status === 'Failed'
  const ready = status === 'Completed' || status === 'ManualEntry'
  const current = confirmed ? 3 : ready ? 2 : 1
  const steps = ['Uploaded', failed ? 'Could not read' : 'Reading report', 'Ready to check', 'Confirmed']
  return <ol className={`report-progress${failed ? ' report-progress--failed' : ''}`} aria-label="Report progress">
    {steps.map((label, index) => <li key={index} className={index < current ? 'is-complete' : index === current ? 'is-current' : ''} aria-current={index === current ? 'step' : undefined}><span>{label}</span><i aria-hidden="true" /></li>)}
  </ol>
}
