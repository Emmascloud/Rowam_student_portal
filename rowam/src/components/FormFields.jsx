export function TextField({ label, required, ...props }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span className="text-gold-600"> *</span>}</label>
      <input className="field-input" required={required} {...props} />
    </div>
  )
}

export function SelectField({ label, required, children, ...props }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span className="text-gold-600"> *</span>}</label>
      <select className="field-select" required={required} {...props}>
        {children}
      </select>
    </div>
  )
}

export function TextAreaField({ label, required, ...props }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span className="text-gold-600"> *</span>}</label>
      <textarea className="field-input min-h-[88px] resize-y" required={required} {...props} />
    </div>
  )
}

export function RadioGroup({ label, name, options, value, onChange, required }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span className="text-gold-600"> *</span>}</label>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
              value === opt.value
                ? 'border-navy-700 bg-navy-800 text-white'
                : 'border-navy-200 bg-white text-navy-700 hover:border-navy-400'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={onChange}
              className="sr-only"
              required={required}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

export function FormSection({ title, description, children }) {
  return (
    <div>
      <div className="section-tag">{title}</div>
      {description && <p className="mt-3 text-sm text-navy-600">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  )
}
