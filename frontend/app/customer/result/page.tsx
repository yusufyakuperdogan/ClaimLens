'use client'

import { useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ResultContent() {
  const searchParams = useSearchParams()
  const claimId = searchParams.get('id')
  // The report comes from the analyze response saved by the upload page,
  // since GET /damage/report requires an agent login.
  const report = useMemo(() => {
    if (!claimId || typeof window === 'undefined') return null
    try {
      const saved = sessionStorage.getItem(`damage-report-${claimId}`)
      return saved ? JSON.parse(saved) : null
    } catch (err) {
      console.error(err)
      return null
    }
  }, [claimId])

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
      case 'MEDIUM': return 'bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30'
      case 'HIGH': return 'bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-400/40'
      case 'CRITICAL': return 'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/40 shadow-[0_0_24px_-6px_rgba(244,63,94,0.7)]'
      default: return 'bg-slate-400/10 text-slate-300 ring-1 ring-inset ring-slate-400/30'
    }
  }

  return (
    <main className="stage flex min-h-screen items-center justify-center overflow-clip px-4 py-12 sm:px-6">
      <div aria-hidden className="orb right-[-20%] top-[-15%] h-[520px] w-[520px] bg-emerald-500/15" />
      <div aria-hidden className="orb orb-delay bottom-[-20%] left-[-20%] h-[560px] w-[560px] bg-indigo-500/25" />

      <div className="w-full max-w-2xl">
        <a href="/" className="back-link reveal mb-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back to Home
        </a>

        <div className="reveal mb-6 flex items-center gap-5 rounded-3xl bg-emerald-400/[0.07] p-5 shadow-[0_0_80px_-30px_rgba(52,211,153,0.7)] ring-1 ring-inset ring-emerald-300/20 backdrop-blur-xl [animation-delay:60ms] sm:p-6">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-teal-500 text-lg font-bold text-emerald-950 shadow-lg shadow-emerald-500/40">
            <span aria-hidden className="ping-slow absolute inset-0 rounded-full ring-2 ring-emerald-300/70" />
            ✓
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Claim Successfully Submitted</h1>
            <p className="text-sm text-emerald-100/80">An agent will review it shortly.</p>
          </div>
        </div>

        {!report && claimId && (
          <div className="card reveal [animation-delay:140ms]">
            <p className="eyebrow mb-1.5">Claim ID</p>
            <p className="break-all font-mono text-sm text-white">{claimId}</p>
          </div>
        )}

        {report && (
          <div className="space-y-4">
            <div className="card reveal [animation-delay:140ms]">
              <p className="eyebrow mb-4">Vehicle Information</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="tile">
                  <p className="mb-1 text-xs text-slate-500">Make</p>
                  <p className="break-words font-semibold text-white">{report.vehicle_make || 'Unknown'}</p>
                </div>
                <div className="tile">
                  <p className="mb-1 text-xs text-slate-500">Model</p>
                  <p className="break-words font-semibold text-white">{report.vehicle_model || 'Unknown'}</p>
                </div>
                <div className="tile">
                  <p className="mb-1 text-xs text-slate-500">Color</p>
                  <p className="break-words font-semibold text-white">{report.vehicle_color || 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div className="card reveal [animation-delay:220ms]">
              <p className="eyebrow mb-4">Damage Assessment</p>
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className={`${severityColor(report.severity)} rounded-full px-3 py-1.5 text-xs font-bold tracking-wide`}>
                  {report.severity} SEVERITY
                </span>
                <div className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 ring-1 ring-inset ring-white/10">
                  <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]"></div>
                  <span className="text-xs text-slate-300">AI Confidence: {Math.round(report.confidence_score * 100)}%</span>
                </div>
              </div>
              <div aria-hidden className="mb-5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="bar-grow h-full rounded-full bg-gradient-to-r from-cyan-300 via-indigo-400 to-violet-400" style={{ width: `${Math.round(report.confidence_score * 100)}%` }} />
              </div>
              <p className="mb-5 text-sm leading-relaxed text-slate-300">{report.damage_type}</p>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400/[0.08] to-indigo-500/[0.06] p-5 pl-6 ring-1 ring-inset ring-cyan-300/15">
                <span aria-hidden className="absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-cyan-300 to-indigo-400" />
                <p className="eyebrow mb-2 text-cyan-200/80">AI Summary</p>
                <p className="text-sm leading-relaxed text-white">{report.ai_summary}</p>
              </div>
            </div>

            <div className="card reveal overflow-hidden [animation-delay:300ms]">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
              <p className="eyebrow mb-4">Estimated Repair Cost</p>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <p className="text-gradient-static text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">${report.estimated_cost_min.toLocaleString('en-US')}</p>
                <p className="mb-1.5 text-xl text-slate-400 sm:text-2xl">— ${report.estimated_cost_max.toLocaleString('en-US')}</p>
              </div>
              <p className="mt-4 text-xs text-slate-500">Estimate based on AI photo analysis. Final cost determined by licensed adjuster.</p>
            </div>

            <div className="card reveal flex items-center justify-between gap-4 [animation-delay:380ms]">
              <div className="min-w-0">
                <p className="eyebrow mb-1.5">Claim ID</p>
                <p className="break-all font-mono text-sm text-white">{claimId}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(claimId || '')
                  alert('Claim ID copied!')
                }}
                className="btn-ghost shrink-0 cursor-pointer rounded-xl px-4 py-2 text-xs font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                </svg>
                Copy ID
              </button>
            </div>

            <div className="reveal [animation-delay:440ms]">
              <a href="/customer" className="btn-ghost w-full py-4">
                + File Another Claim
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#03050b] font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Loading...</div>}>
      <ResultContent />
    </Suspense>
  )
}
