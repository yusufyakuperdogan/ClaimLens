function LensVisual() {
  const ticks = Array.from({ length: 72 })

  return (
    <div aria-hidden className="reveal relative mx-auto aspect-square w-full max-w-[320px] sm:max-w-[460px] [animation-delay:250ms]">
      {/* Glow behind the rotating ring */}
      <div className="absolute inset-0 blur-2xl opacity-70">
        <div className="lens-ring absolute inset-0 rounded-full" />
      </div>
      <div className="lens-ring absolute inset-0 rounded-full" />

      {/* Focus ring with tick marks */}
      <svg viewBox="0 0 400 400" className="spin-reverse absolute inset-[3%] h-[94%] w-[94%]">
        <circle cx="200" cy="200" r="194" fill="none" stroke="rgb(148 163 184 / 0.16)" />
        {ticks.map((_, i) => (
          <line
            key={i}
            x1="200"
            y1="10"
            x2="200"
            y2={i % 6 === 0 ? 26 : 18}
            stroke={i % 6 === 0 ? 'rgb(103 232 249 / 0.75)' : 'rgb(148 163 184 / 0.3)'}
            strokeWidth={i % 6 === 0 ? 2 : 1}
            transform={`rotate(${i * 5} 200 200)`}
          />
        ))}
      </svg>
      <svg viewBox="0 0 400 400" className="spin-slow absolute inset-[9%] h-[82%] w-[82%]">
        <circle cx="200" cy="200" r="196" fill="none" stroke="rgb(129 140 248 / 0.25)" strokeDasharray="2 10" />
      </svg>

      {/* Lens core */}
      <div className="lens-core absolute inset-[14%] overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(103,232,249,0.16),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(167,139,250,0.18),transparent_60%)]" />

        <svg viewBox="0 0 420 200" className="absolute left-1/2 top-1/2 w-[92%] -translate-x-1/2 -translate-y-1/2 overflow-visible">
          <defs>
            <linearGradient id="car-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="55%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>
          <ellipse cx="212" cy="184" rx="176" ry="7" fill="rgb(34 211 238 / 0.14)" />
          <g fill="none" stroke="url(#car-stroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 150 L30 128 Q32 114 52 110 L118 100 Q150 70 196 62 L268 60 Q306 62 336 96 L372 104 Q392 108 394 126 L394 150" />
            <path d="M30 150 L76 150 M144 150 L276 150 M344 150 L394 150" />
            <path d="M76 150 A34 34 0 0 1 144 150 M276 150 A34 34 0 0 1 344 150" />
            <circle cx="110" cy="152" r="25" />
            <circle cx="110" cy="152" r="9" opacity="0.6" />
            <circle cx="310" cy="152" r="25" />
            <circle cx="310" cy="152" r="9" opacity="0.6" />
            <path d="M134 100 L170 74 Q182 68 200 68 L238 68 L238 100 Z" opacity="0.7" />
            <path d="M248 68 L266 68 Q296 70 318 100 L248 100 Z" opacity="0.7" />
            <path d="M243 104 L243 146 M200 116 L214 116 M282 116 L296 116" opacity="0.6" />
          </g>
          <path d="M370 118 l7 7 l-5 6 l8 7" fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M206 124 l10 4 l-4 8" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          <circle className="hotspot" cx="380" cy="128" r="9" fill="none" stroke="#fb7185" strokeWidth="2" />
          <circle cx="380" cy="128" r="4" fill="#fb7185" />
          <circle className="hotspot [animation-delay:0.8s]" cx="212" cy="130" r="9" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="212" cy="130" r="4" fill="#fbbf24" />
          <circle className="hotspot [animation-delay:1.6s]" cx="64" cy="122" r="7" fill="none" stroke="#67e8f9" strokeWidth="2" />
          <circle cx="64" cy="122" r="3" fill="#67e8f9" />
        </svg>

        <div className="scan-beam" />

        {/* Viewfinder corners */}
        <div className="absolute left-[16%] top-[20%] h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-cyan-300/70" />
        <div className="absolute right-[16%] top-[20%] h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-cyan-300/70" />
        <div className="absolute bottom-[20%] left-[16%] h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-cyan-300/70" />
        <div className="absolute bottom-[20%] right-[16%] h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-cyan-300/70" />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="stage flex min-h-screen items-center overflow-clip">
      <div aria-hidden className="orb left-[-12%] top-[-15%] h-[520px] w-[520px] bg-cyan-500/25" />
      <div aria-hidden className="orb orb-delay right-[-15%] top-[15%] h-[620px] w-[620px] bg-indigo-500/25" />
      <div aria-hidden className="orb orb-slow bottom-[-25%] left-[25%] h-[480px] w-[480px] bg-violet-500/20" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <div className="reveal mb-8">
            <span className="chip">
              <span aria-hidden className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              AI-Powered Insurance Platform
            </span>
          </div>
          <h1 className="reveal mb-6 text-6xl font-semibold leading-[0.95] tracking-[-0.045em] text-white [animation-delay:80ms] sm:text-7xl lg:text-8xl">
            Claim<span className="text-gradient">Lens</span>
          </h1>
          <p className="reveal mx-auto mb-4 max-w-xl text-lg leading-relaxed text-slate-300 [animation-delay:160ms] sm:text-xl lg:mx-0">
            File your insurance claim in minutes. Our AI analyzes damage photos instantly and generates professional reports.
          </p>
          <p className="reveal mb-10 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 [animation-delay:220ms]">
            Trusted by insurance professionals across America
          </p>
          <div className="reveal flex flex-wrap justify-center gap-4 [animation-delay:300ms] lg:justify-start">
            <a href="/customer" className="btn-primary px-9 py-4 text-lg">
              File a Claim
              <svg aria-hidden xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
              </svg>
            </a>
            <a href="/agent" className="btn-ghost px-9 py-4 text-lg">
              Agent Portal
            </a>
          </div>
          <div className="reveal mt-16 grid grid-cols-3 gap-3 text-center [animation-delay:400ms] sm:gap-4 lg:text-left">
            <div className="card px-3 py-5 sm:px-6">
              <p className="text-gradient-static text-2xl font-semibold tracking-tight sm:text-4xl">2 min</p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">Average claim time</p>
            </div>
            <div className="card px-3 py-5 sm:px-6">
              <p className="text-gradient-static text-2xl font-semibold tracking-tight sm:text-4xl">98%</p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">AI accuracy rate</p>
            </div>
            <div className="card px-3 py-5 sm:px-6">
              <p className="text-gradient-static text-2xl font-semibold tracking-tight sm:text-4xl">10x</p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">Faster than manual</p>
            </div>
          </div>
        </div>

        <LensVisual />
      </div>
    </main>
  )
}
