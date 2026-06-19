// A clean recreation of the ROWAM mark (graduation cap + open book + pen)
// as an inline SVG so it scales crisply at any size without an image asset.
export default function RowamMark({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#102449" />
      <circle cx="50" cy="50" r="48" stroke="#f5a623" strokeWidth="1.5" />
      {/* open book */}
      <path d="M50 52 L26 46 L26 64 L50 70 L74 64 L74 46 Z" fill="#eef2f9" />
      <path d="M50 52 L50 70" stroke="#102449" strokeWidth="1.2" />
      <path d="M26 46 L50 52 L74 46" stroke="#102449" strokeWidth="1.2" fill="none" />
      {/* graduation cap */}
      <path d="M50 24 L78 36 L50 48 L22 36 Z" fill="#f7f6f2" />
      <path d="M50 24 L78 36 L50 48 L22 36 Z" stroke="#102449" strokeWidth="1" />
      <circle cx="78" cy="36" r="2" fill="#f5a623" />
      <path d="M78 36 L78 46" stroke="#f5a623" strokeWidth="1.5" />
    </svg>
  )
}
