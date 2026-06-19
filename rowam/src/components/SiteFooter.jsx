import RowamMark from './RowamMark'

export default function SiteFooter() {
  return (
    <footer className="border-t border-navy-100 bg-navy-900 text-navy-200">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <RowamMark className="h-9 w-9" />
            <div>
              <div className="font-display text-base font-semibold text-white">ROWAM</div>
              <div className="text-xs text-navy-400">Raising Ordained World Apostleship Missionaries</div>
            </div>
          </div>
          <div className="text-sm text-navy-300">
            <div>Tel: 0816 472 0718</div>
            <div>TikTok: @prophetsamuel2</div>
          </div>
        </div>
        <div className="mt-8 border-t border-navy-800 pt-6 text-xs text-navy-500">
          &copy; {new Date().getFullYear()} ROWAM School of Ministry. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
