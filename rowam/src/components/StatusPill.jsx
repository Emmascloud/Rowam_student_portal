const STYLES = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  declined: 'bg-rose-50 text-rose-700 border border-rose-200',
  paid:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  unpaid:   'bg-charcoal-50 text-charcoal-500 border border-charcoal-200',
}

const DOTS = {
  pending:  'bg-amber-400',
  approved: 'bg-emerald-400',
  declined: 'bg-rose-400',
  paid:     'bg-emerald-400',
  unpaid:   'bg-charcoal-300',
}

export default function StatusPill({ value }) {
  const style = STYLES[value] || STYLES.unpaid
  const dot = DOTS[value] || DOTS.unpaid
  return (
    <span className={`status-pill ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {value}
    </span>
  )
}
