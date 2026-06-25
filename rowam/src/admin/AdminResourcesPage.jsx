import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const TRACKS = [
  { value: 'all', label: 'All tracks' },
  { value: 'evangelists', label: 'Evangelists' },
  { value: 'pastors', label: 'Pastors' },
  { value: 'apostles', label: 'Apostles' },
]

export default function AdminResourcesPage() {
  const { user } = useAuth()
  const fileRef = useRef()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [type, setType] = useState('link')
  const [form, setForm] = useState({ title: '', description: '', url: '', track: 'all' })
  const [file, setFile] = useState(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
    if (error) setError('Could not load resources.')
    else setResources(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true); setError(''); setNotice('')

    let filePath = null
    if (type === 'file' && file) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('resources').upload(path, file, { contentType: file.type })
      if (uploadError) { setError(uploadError.message); setSaving(false); return }
      filePath = path
    }

    const { data, error: insertError } = await supabase.from('resources').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type,
      url: type === 'link' ? form.url.trim() : null,
      file_path: filePath,
      track: form.track,
      created_by: user.id,
    }).select('*').single()

    setSaving(false)
    if (insertError) { setError(insertError.message); return }
    setResources((prev) => [data, ...prev])
    setForm({ title: '', description: '', url: '', track: 'all' })
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setNotice('Resource published.')
  }

  async function handleDelete(resource) {
    if (resource.type === 'file' && resource.file_path) {
      await supabase.storage.from('resources').remove([resource.file_path])
    }
    await supabase.from('resources').delete().eq('id', resource.id)
    setResources((prev) => prev.filter((r) => r.id !== resource.id))
    setNotice('Resource removed.')
  }

  return (
    <div>
      <p className="label-eyebrow">Content management</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">Resources</h1>
      <p className="mt-2 max-w-xl text-sm text-navy-600">Publish PDF files or external links for students to access from their portal.</p>

      <form onSubmit={handleAdd} className="card mt-6 p-6 space-y-4">
        <h2 className="font-semibold text-navy-900">Add a resource</h2>

        <div className="flex gap-2">
          {['link', 'file'].map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${type === t ? 'bg-navy-800 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}>
              {t === 'link' ? 'External link' : 'Upload file'}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label">Title</label>
            <input className="field-input" required placeholder="e.g. Week 1 Study Notes" value={form.title} onChange={(e) => update('title', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Description (optional)</label>
            <input className="field-input" placeholder="Short description…" value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
          {type === 'link' ? (
            <div className="sm:col-span-2">
              <label className="field-label">URL</label>
              <input className="field-input" required type="url" placeholder="https://…" value={form.url} onChange={(e) => update('url', e.target.value)} />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label className="field-label">File (PDF, DOCX, etc.)</label>
              <input ref={fileRef} type="file" className="field-input !py-2" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
            </div>
          )}
          <div>
            <label className="field-label">Visible to</label>
            <select className="field-select" value={form.track} onChange={(e) => update('track', e.target.value)}>
              {TRACKS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {notice && <p className="text-sm text-emerald-600">{notice}</p>}
        <button type="submit" disabled={saving} className="btn-gold">{saving ? 'Publishing…' : 'Publish resource'}</button>
      </form>

      <div className="card mt-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100">
          <h2 className="font-semibold text-navy-900">Published resources ({resources.length})</h2>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-navy-400">Loading…</p>
        ) : resources.length === 0 ? (
          <p className="px-5 py-8 text-sm text-navy-400">No resources published yet.</p>
        ) : (
          <div className="divide-y divide-navy-50">
            {resources.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${r.type === 'file' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {r.type}
                    </span>
                    <span className="text-xs text-navy-400">{r.track}</span>
                  </div>
                  <div className="mt-1 font-semibold text-navy-900 text-sm">{r.title}</div>
                  {r.description && <div className="text-xs text-navy-400 mt-0.5">{r.description}</div>}
                  {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-0.5 block">{r.url}</a>}
                </div>
                <button onClick={() => handleDelete(r)} className="text-xs font-medium text-rose-500 hover:text-rose-700 shrink-0">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
