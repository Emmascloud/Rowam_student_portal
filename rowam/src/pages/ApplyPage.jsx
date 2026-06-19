import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { TextField, SelectField, TextAreaField, RadioGroup, FormSection } from '../components/FormFields'

const EMPTY_EDUCATION = [
  { level: 'Elementary', school_name_address: '', dates_from_to: '', certificate_qualification: '' },
  { level: 'Secondary', school_name_address: '', dates_from_to: '', certificate_qualification: '' },
  { level: 'Tertiary', school_name_address: '', dates_from_to: '', certificate_qualification: '' },
]

const initialState = {
  track: '',
  surname: '',
  first_name: '',
  gender: '',
  age: '',
  above_15: '',
  marital_status: '',
  marital_status_other: '',
  nationality: '',
  home_address: '',
  state_lga: '',
  occupation: '',
  telephone: '',
  mobile_number: '',
  email_address: '',
  born_again: '',
  born_again_when: '',
  born_again_where: '',
  current_church: '',
  church_address: '',
  pastor_name: '',
  pastor_phone: '',
  ministry_role: '',
  education: EMPTY_EDUCATION,
  kin_full_name: '',
  kin_relationship: '',
  kin_phone: '',
  kin_email: '',
  heard_about: '',
  heard_about_other: '',
  declaration_agreed: false,
}

const STEPS = ['Track', 'Personal', 'Spiritual', 'Education', 'Emergency contact', 'Review']

const TRACK_LABELS = {
  evangelists: 'Evangelists Track',
  pastors: 'Pastors Track',
  apostles: 'Apostles Track',
}

const HEARD_LABELS = {
  social_media: 'Social Media',
  church_announcement: 'Church Announcement',
  flyer_poster: 'Flyer / Poster',
  friend_family: 'A Friend / Family Member',
  website_online: 'Website / Online',
  other: 'Other',
}

export default function ApplyPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [existingRef, setExistingRef] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/signup', { state: { redirectTo: '/apply' } })
      return
    }

    async function checkExisting() {
      const { data } = await supabase
        .from('students')
        .select('id, student_ref, status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setExistingRef(data)
      }
      setCheckingExisting(false)
    }
    checkExisting()
  }, [user, authLoading, navigate])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateEducation(index, field, value) {
    setForm((f) => {
      const next = [...f.education]
      next[index] = { ...next[index], [field]: value }
      return { ...f, education: next }
    })
  }

  function validateStep() {
    setError('')
    if (step === 0 && !form.track) {
      setError('Please select a programme track to continue.')
      return false
    }
    if (step === 1) {
      const required = ['surname', 'first_name', 'gender', 'age', 'above_15', 'marital_status', 'nationality', 'home_address', 'state_lga', 'mobile_number', 'email_address']
      for (const f of required) {
        if (!form[f]) {
          setError('Please complete all required fields before continuing.')
          return false
        }
      }
    }
    if (step === 2) {
      if (!form.born_again) {
        setError('Please answer whether you are born again.')
        return false
      }
    }
    if (step === 4) {
      const required = ['kin_full_name', 'kin_relationship', 'kin_phone', 'heard_about']
      for (const f of required) {
        if (!form[f]) {
          setError('Please complete all required fields before continuing.')
          return false
        }
      }
    }
    return true
  }

  function goNext() {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!form.declaration_agreed) {
      setError('You must agree to the declaration before submitting.')
      return
    }
    setSubmitting(true)
    setError('')

    const payload = {
      user_id: user.id,
      track: form.track,
      surname: form.surname.trim(),
      first_name: form.first_name.trim(),
      gender: form.gender,
      age: parseInt(form.age, 10),
      above_15: form.above_15 === 'yes',
      marital_status: form.marital_status,
      marital_status_other: form.marital_status === 'other' ? form.marital_status_other : null,
      nationality: form.nationality.trim(),
      home_address: form.home_address.trim(),
      state_lga: form.state_lga.trim(),
      occupation: form.occupation.trim() || null,
      telephone: form.telephone.trim() || null,
      mobile_number: form.mobile_number.trim(),
      email_address: form.email_address.trim(),
      born_again: form.born_again === 'yes',
      born_again_when: form.born_again_when.trim() || null,
      born_again_where: form.born_again_where.trim() || null,
      current_church: form.current_church.trim() || null,
      church_address: form.church_address.trim() || null,
      pastor_name: form.pastor_name.trim() || null,
      pastor_phone: form.pastor_phone.trim() || null,
      ministry_role: form.ministry_role.trim() || null,
      education: form.education,
      kin_full_name: form.kin_full_name.trim(),
      kin_relationship: form.kin_relationship.trim(),
      kin_phone: form.kin_phone.trim(),
      kin_email: form.kin_email.trim() || null,
      heard_about: form.heard_about,
      heard_about_other: form.heard_about === 'other' ? form.heard_about_other.trim() : null,
      declaration_agreed: true,
    }

    const { error: insertError } = await supabase
      .from('students')
      .insert(payload)
      .select('id, student_ref, status')
      .single()

    setSubmitting(false)

    if (insertError) {
      if (insertError.code === '23505') {
        setError('It looks like you already have an application on file. Refreshing…')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
        return
      }
      setError(insertError.message || 'Something went wrong submitting your application. Please try again.')
      return
    }

    navigate('/dashboard', { replace: true, state: { justSubmitted: true } })
  }

  if (authLoading || checkingExisting) {
    return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-navy-500">Loading…</div>
  }

  if (existingRef) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-navy-900">You've already applied</h1>
        <p className="mt-3 text-navy-600">
          We found an existing application on your account. You can check its status on your dashboard.
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6">
          Go to my dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="label-eyebrow">Student enrollment application</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy-900">Apply to ROWAM</h1>
      <p className="mt-2 text-sm text-navy-600">
        Write your name exactly as you want it to appear on your certificate.
      </p>

      <ol className="mt-8 flex flex-wrap gap-2 text-xs font-medium">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1.5 ${
              i === step
                ? 'bg-navy-800 text-white'
                : i < step
                ? 'bg-gold-100 text-gold-700'
                : 'bg-navy-50 text-navy-400'
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-6 sm:p-8">
        {step === 0 && <StepTrack form={form} update={update} />}
        {step === 1 && <StepPersonal form={form} update={update} />}
        {step === 2 && <StepSpiritual form={form} update={update} />}
        {step === 3 && <StepEducation form={form} updateEducation={updateEducation} />}
        {step === 4 && <StepEmergency form={form} update={update} />}
        {step === 5 && <StepReview form={form} update={update} />}

        {error && (
          <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-navy-100 pt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="btn-outline disabled:opacity-0"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-gold">
              Continue
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-gold">
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepTrack({ form, update }) {
  const tracks = [
    { value: 'evangelists', label: 'Evangelists Track', sub: '6 months' },
    { value: 'pastors', label: 'Pastors Track', sub: '6 months' },
    { value: 'apostles', label: 'Apostles Track', sub: '6 months' },
  ]
  return (
    <FormSection title="Programme / track selection" description="Choose the track you are applying for.">
      <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
        {tracks.map((t) => (
          <button
            type="button"
            key={t.value}
            onClick={() => update('track', t.value)}
            className={`rounded-lg border p-5 text-left transition-colors ${
              form.track === t.value
                ? 'border-navy-700 bg-navy-800 text-white'
                : 'border-navy-200 bg-white hover:border-navy-400'
            }`}
          >
            <div className="font-display text-lg font-semibold">{t.label}</div>
            <div className={`mt-1 text-xs uppercase tracking-wide ${form.track === t.value ? 'text-gold-300' : 'text-navy-500'}`}>
              {t.sub}
            </div>
          </button>
        ))}
      </div>
    </FormSection>
  )
}

function StepPersonal({ form, update }) {
  return (
    <FormSection title="Section A — Personal details">
      <TextField label="Surname" required value={form.surname} onChange={(e) => update('surname', e.target.value)} />
      <TextField label="First name" required value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />

      <RadioGroup
        label="Gender" name="gender" required value={form.gender}
        onChange={(e) => update('gender', e.target.value)}
        options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
      />
      <TextField label="Age" required type="number" min="1" value={form.age} onChange={(e) => update('age', e.target.value)} />

      <RadioGroup
        label="Are you above 15?" name="above_15" required value={form.above_15}
        onChange={(e) => update('above_15', e.target.value)}
        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
      />
      <SelectField label="Marital status" required value={form.marital_status} onChange={(e) => update('marital_status', e.target.value)}>
        <option value="">Select…</option>
        <option value="single">Single</option>
        <option value="married">Married</option>
        <option value="other">Other</option>
      </SelectField>

      {form.marital_status === 'other' && (
        <TextField label="Please specify" value={form.marital_status_other} onChange={(e) => update('marital_status_other', e.target.value)} />
      )}

      <TextField label="Nationality" required value={form.nationality} onChange={(e) => update('nationality', e.target.value)} />
      <TextField label="State / LGA" required value={form.state_lga} onChange={(e) => update('state_lga', e.target.value)} />

      <div className="sm:col-span-2">
        <TextAreaField label="Home address" required value={form.home_address} onChange={(e) => update('home_address', e.target.value)} />
      </div>

      <TextField label="Occupation" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} />
      <TextField label="Telephone" type="tel" value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />

      <TextField label="Mobile number" required type="tel" value={form.mobile_number} onChange={(e) => update('mobile_number', e.target.value)} />
      <TextField label="Email address" required type="email" value={form.email_address} onChange={(e) => update('email_address', e.target.value)} />
    </FormSection>
  )
}

function StepSpiritual({ form, update }) {
  return (
    <FormSection title="Section B — Spiritual background">
      <RadioGroup
        label="Are you born again?" name="born_again" required value={form.born_again}
        onChange={(e) => update('born_again', e.target.value)}
        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
      />
      <div />

      <TextField label="When did you become born again?" value={form.born_again_when} onChange={(e) => update('born_again_when', e.target.value)} />
      <TextField label="Where did you become born again?" value={form.born_again_where} onChange={(e) => update('born_again_where', e.target.value)} />

      <TextField label="Current church / place of worship" value={form.current_church} onChange={(e) => update('current_church', e.target.value)} />
      <TextField label="Address of church" value={form.church_address} onChange={(e) => update('church_address', e.target.value)} />

      <TextField label="Name of your pastor / overseer" value={form.pastor_name} onChange={(e) => update('pastor_name', e.target.value)} />
      <TextField label="Pastor's phone number" type="tel" value={form.pastor_phone} onChange={(e) => update('pastor_phone', e.target.value)} />

      <div className="sm:col-span-2">
        <TextField label="Your ministry role / activity group" value={form.ministry_role} onChange={(e) => update('ministry_role', e.target.value)} />
      </div>
    </FormSection>
  )
}

function StepEducation({ form, updateEducation }) {
  return (
    <div>
      <div className="section-tag">Section C — Educational background</div>
      <p className="mt-3 text-sm text-navy-600">Optional — fill in what applies to you.</p>
      <div className="mt-5 space-y-6">
        {form.education.map((row, i) => (
          <div key={row.level} className="rounded-lg border border-navy-100 p-5">
            <div className="font-semibold text-navy-900">{row.level}</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TextField
                label="School name & address"
                value={row.school_name_address}
                onChange={(e) => updateEducation(i, 'school_name_address', e.target.value)}
              />
              <TextField
                label="Dates (from – to)"
                value={row.dates_from_to}
                onChange={(e) => updateEducation(i, 'dates_from_to', e.target.value)}
              />
              <TextField
                label="Certificate / qualification"
                value={row.certificate_qualification}
                onChange={(e) => updateEducation(i, 'certificate_qualification', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepEmergency({ form, update }) {
  const heardOptions = Object.entries(HEARD_LABELS).map(([value, label]) => ({ value, label }))
  return (
    <>
      <FormSection title="Section D — Emergency / next of kin contact">
        <TextField label="Full name" required value={form.kin_full_name} onChange={(e) => update('kin_full_name', e.target.value)} />
        <TextField label="Relationship" required value={form.kin_relationship} onChange={(e) => update('kin_relationship', e.target.value)} />
        <TextField label="Phone number" required type="tel" value={form.kin_phone} onChange={(e) => update('kin_phone', e.target.value)} />
        <TextField label="Email address" type="email" value={form.kin_email} onChange={(e) => update('kin_email', e.target.value)} />
      </FormSection>

      <div className="mt-8">
        <div className="section-tag">Section E — How did you hear about ROWAM?</div>
        <div className="mt-5">
          <SelectField label="Select one" required value={form.heard_about} onChange={(e) => update('heard_about', e.target.value)}>
            <option value="">Select…</option>
            {heardOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectField>
          {form.heard_about === 'other' && (
            <div className="mt-4">
              <TextField label="Please specify" value={form.heard_about_other} onChange={(e) => update('heard_about_other', e.target.value)} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-navy-50 py-2 text-sm last:border-0">
      <span className="text-navy-500">{label}</span>
      <span className="text-right font-medium text-navy-900">{value || '—'}</span>
    </div>
  )
}

function StepReview({ form, update }) {
  return (
    <div>
      <div className="section-tag">Section F — Review &amp; declaration</div>

      <div className="mt-5 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-500">Track</h3>
          <div className="mt-1 rounded-md bg-navy-50 px-4 py-3">
            <SummaryRow label="Selected track" value={TRACK_LABELS[form.track]} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-500">Personal details</h3>
          <div className="mt-1 rounded-md bg-navy-50 px-4 py-1">
            <SummaryRow label="Name" value={`${form.first_name} ${form.surname}`} />
            <SummaryRow label="Gender" value={form.gender} />
            <SummaryRow label="Age" value={form.age} />
            <SummaryRow label="Mobile" value={form.mobile_number} />
            <SummaryRow label="Email" value={form.email_address} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-500">Emergency contact</h3>
          <div className="mt-1 rounded-md bg-navy-50 px-4 py-1">
            <SummaryRow label="Name" value={form.kin_full_name} />
            <SummaryRow label="Relationship" value={form.kin_relationship} />
            <SummaryRow label="Phone" value={form.kin_phone} />
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-md border border-navy-100 bg-white p-5">
        <p className="text-sm leading-relaxed text-navy-700">
          I hereby declare that all information provided in this form is true and correct to the best of
          my knowledge. I agree to abide by the rules, regulations, and code of conduct of ROWAM School of
          Ministry. I understand that providing false information may result in the cancellation of my
          enrolment.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.declaration_agreed}
            onChange={(e) => update('declaration_agreed', e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-navy-300 text-navy-800 focus:ring-gold-500"
          />
          <span className="text-sm font-medium text-navy-900">
            I agree to the declaration above.
          </span>
        </label>
      </div>

      <div className="mt-5 rounded-md border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800">
        <strong>Note:</strong> All payment to be made on or before the date communicated at your centre visit.
        Registration fee: &#8358;5,000.
      </div>

      <p className="mt-4 text-xs text-navy-500">
        After submitting, your application will be reviewed by ROWAM staff. Please visit the centre to
        complete your photo capture and registration payment.
      </p>
    </div>
  )
}
