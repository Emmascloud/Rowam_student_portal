const SIZES = {
  xs: { box: 'h-8 w-8',   text: 'text-[10px]', ring: 'ring-1' },
  sm: { box: 'h-10 w-10', text: 'text-xs',      ring: 'ring-1' },
  md: { box: 'h-12 w-12', text: 'text-sm',      ring: 'ring-2' },
  lg: { box: 'h-16 w-16', text: 'text-xl',      ring: 'ring-2' },
  xl: { box: 'h-20 w-20', text: 'text-2xl',     ring: 'ring-2' },
}

export default function Avatar({ url, firstName, surname, size = 'lg' }) {
  const initials = `${firstName?.[0] || ''}${surname?.[0] || ''}`.toUpperCase()
  const { box, text, ring } = SIZES[size] || SIZES.lg

  if (url) {
    return (
      <img
        src={url}
        alt={`${firstName || ''} ${surname || ''}`.trim() || 'Student'}
        className={`${box} shrink-0 rounded-full object-cover ${ring} ring-white shadow-md`}
      />
    )
  }

  return (
    <div className={`${box} ${text} ${ring} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 font-display font-semibold text-white ring-white shadow-md`}>
      {initials || '?'}
    </div>
  )
}
