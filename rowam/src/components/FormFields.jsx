export function TextField({ label, required, ...props }) {
  return (
    <div>
      <label className="field-label">
        {label}{required && <span className="text-indigo-500"> *</span>}
      </label>
      <input className="field-input" required={required} {...props} />
    </div>
  )
}

export function SelectField({ label, required, children, ...props }) {
  return (
    <div>
      <label className="field-label">
        {label}{required && <span className="text-indigo-500"> *</span>}
      </label>
      <select className="field-select" required={required} {...props}>
        {children}
      </select>
    </div>
  )
}

export function TextAreaField({ label, required, ...props }) {
  return (
    <div>
      <label className="field-label">
        {label}{required && <span className="text-indigo-500"> *</span>}
      </label>
      <textarea className="field-input min-h-[88px] resize-y" required={required} {...props} />
    </div>
  )
}

export function RadioGroup({ label, name, options, value, onChange, required }) {
  return (
    <div>
      <label className="field-label">
        {label}{required && <span className="text-indigo-500"> *</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              value === opt.value
                ? 'border-indigo-500 bg-indigo-600 text-white'
                : 'border-charcoal-200 bg-white text-charcoal-700 hover:border-indigo-300'
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
      <div className="section-tag inline-block">{title}</div>
      {description && <p className="mt-3 text-sm text-charcoal-500">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  )
}
