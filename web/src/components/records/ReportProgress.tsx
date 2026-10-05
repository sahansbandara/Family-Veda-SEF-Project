// S2 · Real report states, without invented percentages or clinical interpretation.
// The last step is doctor review: AI only assists the doctor, and nothing reaches the patient without approval (RULE 2).
export function ReportProgress({ status, confirmed = false }: { status: string; confirmed?: boolean }) {
  const failed = status === 'Failed'
  const reading = status === 'Pending' || status === 'Processing'
  const ready = status === 'Completed' || status === 'ManualEntry'
  const current = confirmed ? 4 : ready ? 2 : 1
  const steps = [
    { label: 'Uploaded', hint: 'File saved' },
    { label: failed ? 'Could not read' : 'Reading text', hint: failed ? 'See the reason below' : reading ? 'In progress' : 'Text read' },
    { label: 'Values found', hint: ready && !confirmed ? 'Check them now' : 'Test rows extracted' },
    { label: 'You confirmed', hint: 'Checked against the original' },
    { label: 'Doctor review', hint: 'AI-assisted, doctor-approved' },
  ]
  return <ol className={`report-progress${failed ? ' report-progress--failed' : ''}`} aria-label="Report progress">
    {steps.map((step, index) => <li key={step.label} className={index < current ? 'is-complete' : index === current ? 'is-current' : ''} aria-current={index === current ? 'step' : undefined}>
      <b aria-hidden="true">{index < current ? '✓' : index + 1}</b><span>{step.label}<small>{step.hint}</small></span><i aria-hidden="true" />
    </li>)}
  </ol>
}
