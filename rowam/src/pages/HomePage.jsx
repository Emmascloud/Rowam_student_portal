import { Link } from 'react-router-dom'

const TRACKS = [
  {
    name: 'Evangelists Track',
    duration: '6 months',
    blurb: 'Equipping believers to carry the gospel with clarity, boldness, and the power to win souls.',
  },
  {
    name: 'Pastors Track',
    duration: '6 months',
    blurb: 'Forming shepherds who can feed, guide, and protect the flock entrusted to their care.',
  },
  {
    name: 'Apostles Track',
    duration: '6 months',
    blurb: 'Raising spiritual fathers and pioneers, sent to plant and establish kingdom work.',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }} />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="label-eyebrow text-gold-400">Enrollment now open</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.1] text-white sm:text-6xl">
            Raising Ordained World Apostleship Missionaries
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">
            A School of Ministry committed to equipping believers for impactful service in God's kingdom —
            developing Evangelists, Pastors, and Apostles who grow spiritually and function effectively in their calling.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/apply" className="btn-gold !px-7 !py-3.5 text-base">
              Begin your application
            </Link>
            <Link to="/timetable" className="text-sm font-semibold text-navy-100 underline decoration-navy-500 underline-offset-4 hover:text-white">
              View class timetable
            </Link>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-navy-700 pt-8 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-navy-400">Start date</dt>
              <dd className="mt-1 font-display text-lg text-white">Thursdays</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-navy-400">Class time</dt>
              <dd className="mt-1 font-display text-lg text-white">5:00 – 7:00 PM</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-navy-400">Duration</dt>
              <dd className="mt-1 font-display text-lg text-white">6 months</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-navy-400">Registration fee</dt>
              <dd className="mt-1 font-display text-lg text-white">&#8358;5,000</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Tracks */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="label-eyebrow">Programme tracks</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold text-navy-900">
          Three callings. One foundation.
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {TRACKS.map((track) => (
            <div key={track.name} className="card p-7">
              <div className="text-xs font-semibold uppercase tracking-wide text-gold-600">{track.duration}</div>
              <h3 className="mt-2 font-display text-xl font-semibold text-navy-900">{track.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-navy-600">{track.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy-50/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="label-eyebrow">How enrollment works</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold text-navy-900">
            From application to your first class.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="font-display text-3xl text-gold-500">1</div>
              <h3 className="mt-2 font-semibold text-navy-900">Apply online</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">
                Fill out the enrollment form from your phone or computer — personal details, spiritual
                background, education, and your selected track.
              </p>
            </div>
            <div>
              <div className="font-display text-3xl text-gold-500">2</div>
              <h3 className="mt-2 font-semibold text-navy-900">Visit the centre</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">
                Once reviewed, visit the ROWAM centre to complete your passport photo and
                identification capture, and settle your registration fee.
              </p>
            </div>
            <div>
              <div className="font-display text-3xl text-gold-500">3</div>
              <h3 className="mt-2 font-semibold text-navy-900">Start training</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">
                Receive your student reference number and join your track's class on the published
                timetable.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <Link to="/apply" className="btn-primary !px-7 !py-3.5 text-base">
              Start your application
            </Link>
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="card flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-navy-900">Have questions before you apply?</h3>
            <p className="mt-1 text-sm text-navy-600">Reach us on WhatsApp or call for payment details and enrollment support.</p>
          </div>
          <a href="tel:+2348164720718" className="btn-outline shrink-0 !px-6 !py-3 text-sm">
            Call 0816 472 0718
          </a>
        </div>
      </section>
    </div>
  )
}
