import RowamMark from './RowamMark'

export default function SiteFooter() {
  return (
    <footer className="border-t border-charcoal-100 bg-charcoal-950 text-charcoal-400">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <RowamMark className="h-9 w-9" />
              <div>
                <div className="font-display text-base font-semibold text-white">ROWAM</div>
                <div className="text-xs text-charcoal-500">Raising Ordained World Apostleship Missionaries</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal-500">
              A School of Ministry committed to raising and equipping believers for impactful service in God's kingdom.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 text-sm">
            <div>
              <div className="font-semibold text-white mb-3">Programmes</div>
              <ul className="space-y-2">
                <li>Evangelists Track (6 months)</li>
                <li>Pastors Track (6 months)</li>
                <li>Apostles Track (6 months)</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white mb-3">Contact</div>
              <ul className="space-y-2">
                <li>Tel: 0816 472 0718</li>
                <li>@prophetsamuel2</li>
                <li>Time: 5:00 – 7:00 PM</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-charcoal-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-charcoal-600">
          <span>&copy; {new Date().getFullYear()} ROWAM School of Ministry. All rights reserved.</span>
          <span>Directed by Prophet Samuel Omomajemu</span>
        </div>
      </div>
    </footer>
  )
}
