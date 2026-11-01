'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [formData, setFormData] = useState({
    incident_type: '',
    incident_date: '',
    location: '',
    description: '',
  })
  const [files, setFiles] = useState<FileList | null>(null)
  const [claimId, setClaimId] = useState('')

  const incidentTypes = ['Car Accident', 'Hail Damage', 'Flood Damage', 'Theft', 'Vandalism', 'Other']
  const today = new Date().toISOString().split('T')[0]

  const getErrorMessage = async (res: Response, fallback: string) => {
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') return data.detail
    } catch {}
    return fallback
  }

  const handleSubmitClaim = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claims/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          incident_date: new Date(formData.incident_date).toISOString(),
          user_id: 'guest-user',
        }),
      })
      if (!res.ok) {
        alert(await getErrorMessage(res, 'Error submitting claim. Please try again.'))
        return
      }
      const data = await res.json()
      setClaimId(data.claim.id)
      setStep(2)
    } catch (err) {
      alert('Error submitting claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!files || files.length === 0) return alert('Please upload at least one photo.')
    setLoading(true)
    try {
      const formDataObj = new FormData()
      for (let i = 0; i < files.length; i++) {
        formDataObj.append('files', files[i])
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/damage/analyze/${claimId}`, {
        method: 'POST',
        body: formDataObj,
      })
      if (!res.ok) {
        alert(await getErrorMessage(res, 'Error analyzing damage. Please try again.'))
        return
      }
      const data = await res.json()
      try {
        sessionStorage.setItem(`damage-report-${claimId}`, JSON.stringify(data.damage_report))
      } catch {}
      router.push(`/customer/result?id=${claimId}`)
    } catch (err) {
      alert('Error analyzing damage. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="stage flex min-h-screen items-center justify-center overflow-clip px-4 py-12 sm:px-6">
      <div aria-hidden className="orb left-[-20%] top-[-10%] h-[480px] w-[480px] bg-cyan-500/20" />
      <div aria-hidden className="orb orb-delay bottom-[-20%] right-[-20%] h-[560px] w-[560px] bg-indigo-500/25" />

      <div className="w-full max-w-xl">
        <a href="/" className="back-link reveal mb-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back to Home
        </a>

        <div className="reveal mb-8 [animation-delay:60ms]">
          <h1 className="mb-2 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">File a Claim</h1>
          <p className="text-sm text-slate-400 sm:text-base">Complete the form and upload damage photos for AI analysis</p>
        </div>

        <div className="reveal mb-8 flex items-center gap-2 [animation-delay:120ms] sm:gap-3">
          <div className={`step ${step >= 1 ? 'step-active' : ''}`}>
            <span>1</span><span>Incident Details</span>
          </div>
          <div className="relative h-px flex-1 overflow-hidden rounded-full bg-white/10">
            <div className={`absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-300 to-indigo-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] transition-all duration-700 ease-out ${step >= 2 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`step ${step >= 2 ? 'step-active' : ''}`}>
            <span>2</span><span>Upload Photos</span>
          </div>
        </div>

        {step === 1 && (
          <div className="card reveal p-6 [animation-delay:180ms] sm:p-8">
            <h2 className="mb-7 text-xl font-semibold tracking-tight text-white">Incident Details</h2>
            <div className="space-y-6">
              <div>
                <label className="eyebrow mb-2.5 block">Incident Type</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`field flex items-center justify-between text-left ${dropdownOpen ? 'border-cyan-300/60' : ''}`}
                  >
                    <span className={formData.incident_type ? 'text-white' : 'text-slate-500'}>
                      {formData.incident_type || 'Select type...'}
                    </span>
                    <span className={`text-[10px] text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180 text-cyan-300' : ''}`}>▼</span>
                  </button>
                  {dropdownOpen && (
                    <div className="dropdown-in absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1e] p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]">
                      {incidentTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, incident_type: type })
                            setDropdownOpen(false)
                          }}
                          className={`w-full rounded-xl px-4 py-2.5 text-left transition hover:bg-white/[0.06] hover:text-white ${formData.incident_type === type ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-300'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="eyebrow mb-2.5 block">Incident Date</label>
                <input
                  type="date"
                  max={today}
                  className="field [color-scheme:dark]"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                />
              </div>
              <div>
                <label className="eyebrow mb-2.5 block">Location</label>
                <input
                  type="text"
                  placeholder="123 Main St, City, State"
                  className="field"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <label className="eyebrow mb-2.5 block">Description <span className="normal-case tracking-normal text-slate-600">(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Describe what happened..."
                  className="field resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <button
                onClick={handleSubmitClaim}
                disabled={loading || !formData.incident_type || !formData.incident_date || !formData.location}
                className={`btn-primary mt-2 w-full py-4 ${loading ? 'is-loading' : ''}`}
              >
                {loading ? 'Submitting...' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card reveal p-6 sm:p-8">
            <h2 className="mb-1 text-xl font-semibold tracking-tight text-white">Upload Damage Photos</h2>
            <p className="mb-7 text-sm text-slate-400">Upload up to 10 photos for best AI analysis results</p>
            <label htmlFor="file-upload" className="group block cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center transition duration-300 group-hover:border-cyan-300/50 group-hover:bg-cyan-400/[0.04] group-hover:shadow-[0_0_60px_-20px_rgba(34,211,238,0.6)]">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.12),transparent_60%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 text-3xl ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:scale-110">📷</div>
                <p className="relative mb-1 font-medium text-white">Click to upload photos</p>
                <p className="relative text-sm text-slate-500">JPG, PNG, WEBP — up to 10 files</p>
                {files && (
                  <p className="fade-in relative mt-4 inline-flex rounded-full bg-cyan-400/10 px-3.5 py-1 text-sm font-medium text-cyan-200 ring-1 ring-cyan-300/30">{files.length} photo(s) selected ✓</p>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="file-upload"
                onChange={(e) => setFiles(e.target.files)}
              />
            </label>
            <button
              onClick={handleAnalyze}
              disabled={loading || !files}
              className={`btn-primary mt-6 w-full py-4 ${loading ? 'is-loading' : ''}`}
            >
              {loading ? '🔍 Analyzing with AI...' : 'Analyze Damage →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
