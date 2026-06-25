import { Link } from 'react-router-dom'

const TRACKS = [
  {
    name: 'Evangelists',
    icon: '✦',
    color: 'from-amber-500 to-orange-600',
    blurb: 'Carry the gospel with clarity, boldness, and the power to win souls.',
  },
  {
    name: 'Pastors',
    icon: '✦',
    color: 'from-indigo-500 to-indigo-700',
    blurb: 'Shepherd and guide the flock with wisdom, grace, and pastoral heart.',
  },
  {
    name: 'Apostles',
    icon: '✦',
    color: 'from-emerald-500 to-teal-700',
    blurb: 'Pioneer and establish kingdom work as a sent and ordained apostle.',
  },
]

const STATS = [
  { label: 'Programme duration', value: '6 months' },
  { label: 'Class time', value: '5–7 PM' },
  { label: 'Registration fee', value: '₦5,000' },
  { label: 'Active tracks', value: '3' },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal-950 min-h-[92vh] flex items-center">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Indigo glow blob */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600 opacity-[0.06] blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-indigo-500 opacity-[0.04] blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Enrollment Now Open
            </div>

            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-white sm:text-7xl">
              Raising Ordained<br />
              <span className="text-indigo-400">World Apostleship</span><br />
              Missionaries
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-charcoal-300">
              A School of Ministry equipping believers for Evangelistic, Pastoral, and Apostolic calling —
              developing men and women who function powerfully in their God-given purpose.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/apply" className="btn-indigo !px-8 !py-4 text-base !rounded-2xl">
                Begin your application →
              </Link>
              <Link to="/timetable" className="btn-ghost !text-charcoal-300 hover:!text-white !px-6 !py-4 text-base">
                View timetable
              </Link>
            </div>

            <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-charcoal-800 pt-10 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="text-[11px] uppercase tracking-widest text-charcoal-500">{s.label}</dt>
                  <dd className="mt-1.5 font-display text-xl font-semibold text-white">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="text-center">
          <div className="eyebrow">Programme Tracks</div>
          <h2 className="mt-3 font-display text-4xl font-semibold text-charcoal-900">
            Three callings.<br className="sm:hidden" /> One foundation.
          </h2>
          <p className="mt-4 text-charcoal-500 max-w-lg mx-auto">
            Choose the track that aligns with your calling. Each programme runs for 6 months with weekly sessions.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {TRACKS.map((track) => (
            <div key={track.name} className="group relative overflow-hidden rounded-3xl bg-charcoal-900 p-8 transition-transform hover:-translate-y-1">
              <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${track.color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${track.color} text-white text-sm font-bold`}>
                {track.icon}
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-white">{track.name} Track</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-400">{track.blurb}</p>
              <div className="mt-5 text-xs font-bold uppercase tracking-widest text-charcoal-500">6 months</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-cream-100 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="eyebrow">Enrollment Process</div>
          <h2 className="mt-3 font-display text-4xl font-semibold text-charcoal-900">
            From application to<br className="sm:hidden" /> your first class.
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Apply online', desc: 'Fill the enrollment form from your phone — personal details, spiritual background, education, and your selected track.' },
              { step: '02', title: 'Visit the centre', desc: 'Complete your photo and fingerprint capture on-site and settle the ₦5,000 registration fee.' },
              { step: '03', title: 'Start training', desc: 'Receive your student reference number and access your student portal with your courses and resources.' },
            ].map((item) => (
              <div key={item.step} className="card p-7">
                <div className="font-display text-4xl font-semibold text-indigo-200">{item.step}</div>
                <h3 className="mt-3 font-semibold text-charcoal-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link to="/apply" className="btn-indigo !px-8 !py-4 text-base !rounded-2xl">
              Start your application →
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="card-dark rounded-3xl p-10 sm:p-14 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">Have questions before applying?</h3>
            <p className="mt-2 text-charcoal-400">Reach us via WhatsApp or call for payment details and enrollment support.</p>
          </div>
          <a href="tel:+2348164720718"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl border border-charcoal-700 bg-charcoal-800 px-7 py-4 text-sm font-semibold text-white hover:bg-charcoal-700 transition-colors">
            Call 0816 472 0718
          </a>
        </div>
      </section>
    </div>
  )
}
