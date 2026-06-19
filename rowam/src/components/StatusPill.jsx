const STYLES = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  declined: 'bg-rose-50 text-rose-700 border border-rose-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  unpaid: 'bg-navy-50 text-navy-600 border border-navy-200',
}

export default function StatusPill({ value }) {
  const style = STYLES[value] || 'bg-navy-50 text-navy-600 border border-navy-200'
  return <span className={`status-pill ${style}`}>{value}</span>
}
