"use client";

import { useEffect, useState } from "react";

export default function AgentPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password }),
      });

      if (!res.ok) {
        setPasswordError(true);
        return;
      }

      const data = await res.json();
      setToken(data.access_token);
      setAuthenticated(true);
      setPasswordError(false);
    } catch (err) {
      setPasswordError(true);
    }
  };

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [filter, setFilter] = useState("ALL");
  const [photos, setPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Session expired or token rejected: drop the token and show the login form again.
  const handleUnauthorized = () => {
    setToken(null);
    setAuthenticated(false);
    setPassword("");
    setSelected(null);
    setReport(null);
    setPhotos([]);
    setLightboxIndex(null);
    setLoading(true);
  };

  useEffect(() => {
    if (!authenticated) return;
    const fetchClaims = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/claims/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          setToken(null);
          setAuthenticated(false);
          setPassword("");
          return;
        }
        if (!res.ok) throw new Error(`Failed to load claims (status ${res.status})`);
        const data = await res.json();
        setClaims(data.claims ?? []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchClaims();
  }, [authenticated, token]);

  const fetchReport = async (claimId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/damage/report/${claimId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        setReport(null);
        return;
      }
      const data = await res.json();
      setReport(data.damage_report ?? null);
    } catch (err) {
      setReport(null);
    }
  };

  const fetchPhotos = async (claimId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/damage/photos/${claimId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        setPhotos([]);
        return;
      }
      const data = await res.json();
      setPhotos(data.photos ?? []);
    } catch (err) {
      setPhotos([]);
    }
  };

  const handleSelectClaim = (claim: any) => {
    setSelected(claim);
    setReport(null);
    setPhotos([]);
    setLightboxIndex(null);
    fetchReport(claim.id);
    fetchPhotos(claim.id);
  };

  const updateStatus = async (claimId: string, status: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/claims/${claimId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) {
        alert("Error updating status");
        return;
      }

      setClaims(claims.map((c) => (c.id === claimId ? { ...c, status } : c)));
      setSelected({ ...selected, status });
    } catch (err) {
      alert("Error updating status");
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "LOW":
        return "bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/30";
      case "MEDIUM":
        return "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30";
      case "HIGH":
        return "bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-400/40";
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/40 shadow-[0_0_24px_-6px_rgba(244,63,94,0.7)]";
      default:
        return "bg-slate-400/10 text-slate-300 ring-1 ring-inset ring-slate-400/30";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30 font-semibold";
      case "UNDER_REVIEW":
        return "bg-sky-400/10 text-sky-300 ring-1 ring-inset ring-sky-400/30 font-semibold";
      case "APPROVED":
        return "bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/30 font-semibold";
      case "REJECTED":
        return "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-400/30 font-semibold";
      default:
        return "bg-slate-400/10 text-slate-300 ring-1 ring-inset ring-slate-400/30 font-semibold";
    }
  };

  const filteredClaims = claims
    .filter((c) => (filter === "ALL" ? true : c.status === filter))
    .filter(
      (c) =>
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase()) ||
        c.incident_type.toLowerCase().includes(search.toLowerCase()),
    );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const apertureIcon = (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
    </svg>
  );

  if (!authenticated) {
    return (
      <main className="stage flex min-h-screen items-center justify-center overflow-clip px-4">
        <div aria-hidden className="orb left-[-15%] top-[-20%] h-[520px] w-[520px] bg-cyan-500/20" />
        <div aria-hidden className="orb orb-delay bottom-[-25%] right-[-15%] h-[560px] w-[560px] bg-violet-500/25" />

        <div className="card reveal w-full max-w-sm p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="relative mx-auto mb-6 h-16 w-16">
              <div aria-hidden className="lens-ring absolute -inset-1 rounded-full" />
              <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-cyan-400/15 to-indigo-500/20 p-4 text-cyan-200 ring-1 ring-inset ring-white/10">
                {apertureIcon}
              </div>
            </div>
            <p className="mb-1.5 text-3xl font-semibold tracking-[-0.03em] text-white">
              Claim<span className="text-gradient">Lens</span>
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Agent Portal — Restricted Access
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Enter agent password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={`field ${passwordError ? "field-error shake" : ""}`}
            />
            {passwordError && (
              <p className="fade-in text-center text-sm text-rose-300">
                Incorrect password. Please try again.
              </p>
            )}
            <button
              onClick={handleLogin}
              className="btn-primary w-full py-3.5"
            >
              Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="stage min-h-screen overflow-clip">
      <div aria-hidden className="orb right-[-15%] top-[-25%] h-[560px] w-[560px] bg-indigo-500/20" />
      <div aria-hidden className="orb orb-slow bottom-[-30%] left-[20%] h-[520px] w-[520px] bg-cyan-500/10" />

      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#03050b]/60 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
            <span className="h-7 w-7 text-cyan-300">{apertureIcon}</span>
            <span>
              Claim<span className="text-gradient">Lens</span>
            </span>
          </a>
          <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200 ring-1 ring-inset ring-cyan-300/25">
            Agent Portal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden className="relative hidden h-2 w-2 sm:flex">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <p className="font-mono text-xs text-slate-400 sm:text-sm">{claims.length} total claims</p>
        </div>
      </div>

      <div className="flex h-[calc(100dvh-4rem)] flex-col md:flex-row">
        <div
          className={`${selected ? "hidden md:flex" : "flex"} scroll-thin w-full flex-col overflow-y-auto border-r border-white/[0.07] bg-[#03050b]/40 backdrop-blur-xl md:w-96 md:shrink-0`}
        >
          <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#050811]/85 backdrop-blur-xl">
            <div className="p-3">
              <div className="relative">
                <svg aria-hidden xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.656a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by ID, location, type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="field rounded-xl py-2.5 pl-9 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 px-3 pb-3">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-2.5 py-1.5 font-mono text-[10px] font-medium transition duration-300 ${filter === s ? "bg-gradient-to-r from-cyan-300 to-indigo-400 text-[#03050b] shadow-[0_0_20px_-4px_rgba(34,211,238,0.7)]" : "bg-white/[0.04] text-slate-400 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08] hover:text-white"}`}
                >
                  {s}{" "}
                  {s === "ALL"
                    ? `(${claims.length})`
                    : `(${claims.filter((c) => c.status === s).length})`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center gap-3">
              <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
              <p className="text-sm text-slate-400">Loading claims...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-slate-500">No claims found</p>
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                onClick={() => handleSelectClaim(claim)}
                className={`group relative cursor-pointer border-b border-white/[0.05] px-4 py-4 transition duration-300 hover:bg-white/[0.035] ${selected?.id === claim.id ? "bg-gradient-to-r from-cyan-400/[0.12] via-indigo-400/[0.05] to-transparent" : ""}`}
              >
                {selected?.id === claim.id && (
                  <span aria-hidden className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-300 to-indigo-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                )}
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white transition group-hover:text-cyan-100">
                    {claim.incident_type}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide ${statusColor(claim.status)}`}
                  >
                    {claim.status}
                  </span>
                </div>
                <p className="mb-1 text-xs text-slate-400">{claim.location}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(claim.incident_date)}
                </p>
                <p className="mt-1.5 truncate font-mono text-[10px] text-slate-600">
                  {claim.id}
                </p>
              </div>
            ))
          )}
        </div>

        <div className={`${!selected ? "hidden md:block" : "block"} scroll-thin flex-1 overflow-y-auto p-4 sm:p-8`}>
          {!selected ? (
            <div className="flex h-full items-center justify-center">
              <div className="reveal text-center">
                <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center">
                  <div aria-hidden className="lens-ring absolute inset-0 rounded-full opacity-60" />
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/10">
                    <p className="text-3xl">📋</p>
                  </div>
                </div>
                <p className="text-lg font-semibold tracking-tight text-white">
                  Select a claim
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Click on a claim to view details
                </p>
              </div>
            </div>
          ) : (
            <div key={selected.id} className="mx-auto max-w-3xl space-y-4">
              <button
              onClick={() => setSelected(null)}
              className="back-link mb-2 md:hidden"
              >
                ← Back to claims
              </button>
              <div className="reveal flex items-start justify-between gap-4 pb-2">
                <div>
                  <h2 className="mb-1.5 text-3xl font-semibold tracking-[-0.03em] text-white">
                    {selected.incident_type}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {selected.location} · {formatDate(selected.incident_date)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-xs tracking-wide ${statusColor(selected.status)}`}
                >
                  {selected.status}
                </span>
              </div>

              {selected.description && (
                <div className="card reveal [animation-delay:60ms]">
                  <p className="eyebrow mb-2">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed text-white">{selected.description}</p>
                </div>
              )}

              {photos.length > 0 && (
                <div className="card reveal [animation-delay:120ms]">
                  <p className="eyebrow mb-4">
                    Damage Photos ({photos.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {photos.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Photo ${i + 1}`}
                        onClick={() => setLightboxIndex(i)}
                        className="h-24 w-full cursor-zoom-in rounded-xl object-cover ring-1 ring-white/10 transition duration-300 hover:scale-[1.03] hover:ring-cyan-300/60 hover:shadow-[0_0_30px_-8px_rgba(34,211,238,0.7)] sm:h-28"
                      />
                    ))}
                  </div>
                </div>
              )}

              {report ? (
                <>
                  <div className="card reveal [animation-delay:180ms]">
                    <p className="eyebrow mb-4">
                      Vehicle Information
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="tile">
                        <p className="mb-1 text-xs text-slate-500">Make</p>
                        <p className="break-words font-semibold text-white">
                          {report.vehicle_make || "Unknown"}
                        </p>
                      </div>
                      <div className="tile">
                        <p className="mb-1 text-xs text-slate-500">Model</p>
                        <p className="break-words font-semibold text-white">
                          {report.vehicle_model || "Unknown"}
                        </p>
                      </div>
                      <div className="tile">
                        <p className="mb-1 text-xs text-slate-500">Color</p>
                        <p className="break-words font-semibold text-white">
                          {report.vehicle_color || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card reveal [animation-delay:240ms]">
                    <p className="eyebrow mb-4">
                      Damage Assessment
                    </p>
                    <div className="mb-3 flex flex-wrap items-center gap-2.5">
                      <span
                        className={`${severityColor(report.severity)} rounded-full px-3 py-1.5 text-xs font-bold tracking-wide`}
                      >
                        {report.severity} SEVERITY
                      </span>
                      <div className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 ring-1 ring-inset ring-white/10">
                        <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]"></div>
                        <span className="text-xs text-slate-300">
                          AI Confidence:{" "}
                          {Math.round(report.confidence_score * 100)}%
                        </span>
                      </div>
                    </div>
                    <div aria-hidden className="mb-5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="bar-grow h-full rounded-full bg-gradient-to-r from-cyan-300 via-indigo-400 to-violet-400"
                        style={{ width: `${Math.round(report.confidence_score * 100)}%` }}
                      />
                    </div>
                    <p className="mb-5 text-sm leading-relaxed text-slate-300">
                      {report.damage_type}
                    </p>
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400/[0.08] to-indigo-500/[0.06] p-5 pl-6 ring-1 ring-inset ring-cyan-300/15">
                      <span aria-hidden className="absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-cyan-300 to-indigo-400" />
                      <p className="eyebrow mb-2 text-cyan-200/80">
                        AI Summary
                      </p>
                      <p className="text-sm leading-relaxed text-white">
                        {report.ai_summary}
                      </p>
                    </div>
                  </div>

                  <div className="card reveal overflow-hidden [animation-delay:300ms]">
                    <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
                    <p className="eyebrow mb-4">
                      Estimated Repair Cost
                    </p>
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                      <p className="text-gradient-static text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                        ${report.estimated_cost_min.toLocaleString("en-US")}
                      </p>
                      <p className="mb-1 text-xl text-slate-400">
                        — ${report.estimated_cost_max.toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card reveal [animation-delay:180ms]">
                  <p className="text-sm text-slate-400">
                    No damage report yet for this claim.
                  </p>
                </div>
              )}

              {selected.status === "PENDING" && (
                <div className="reveal flex gap-3 [animation-delay:360ms]">
                  <button
                    onClick={() => updateStatus(selected.id, "APPROVED")}
                    className="btn-approve flex-1 py-3.5"
                  >
                    ✓ Approve Claim
                  </button>
                  <button
                    onClick={() => updateStatus(selected.id, "REJECTED")}
                    className="btn-reject flex-1 py-3.5"
                  >
                    ✕ Reject Claim
                  </button>
                </div>
              )}

              {selected.status === "APPROVED" && (
                <div className="fade-in rounded-2xl bg-emerald-400/[0.08] p-4 text-center shadow-[0_0_60px_-25px_rgba(52,211,153,0.8)] ring-1 ring-inset ring-emerald-300/25">
                  <p className="font-semibold text-emerald-100">
                    ✓ This claim has been approved
                  </p>
                </div>
              )}

              {selected.status === "REJECTED" && (
                <div className="fade-in rounded-2xl bg-rose-500/[0.08] p-4 text-center shadow-[0_0_60px_-25px_rgba(244,63,94,0.8)] ring-1 ring-inset ring-rose-300/25">
                  <p className="font-semibold text-rose-100">
                    ✕ This claim has been rejected
                  </p>
                </div>
              )}

              <div className="card reveal flex items-center justify-between gap-4 [animation-delay:420ms]">
                <div className="min-w-0">
                  <p className="eyebrow mb-1.5">
                    Claim ID
                  </p>
                  <p className="break-all font-mono text-sm text-white">{selected.id}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selected.id);
                    alert("Claim ID copied!");
                  }}
                  className="btn-ghost shrink-0 cursor-pointer rounded-xl px-4 py-2 text-xs font-medium"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                  </svg>
                  Copy ID
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#03050b]/85 backdrop-blur-xl"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative w-full max-w-4xl px-4 sm:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-4 grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-lg text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/[0.12] hover:ring-cyan-300/50 sm:right-16"
            >
              ✕
            </button>
            <p className="mb-3 text-center font-mono text-xs tracking-widest text-slate-400">
              {lightboxIndex + 1} / {photos.length}
            </p>
            <img
              src={photos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-h-[75vh] w-full rounded-2xl object-contain shadow-[0_40px_120px_-30px_rgba(0,0,0,1)] transition-transform duration-150 ease-out"
              onWheel={(e) => {
                e.preventDefault();
                const img = e.currentTarget;
                const rect = img.getBoundingClientRect();
                const offsetX = ((e.clientX - rect.left) / rect.width) * 100;
                const offsetY = ((e.clientY - rect.top) / rect.height) * 100;
                const currentScale = parseFloat(img.dataset.scale || "1");
                const newScale =
                  e.deltaY < 0
                    ? Math.min(currentScale + 0.15, 4)
                    : Math.max(currentScale - 0.15, 0.5);
                img.dataset.scale = String(newScale);
                img.style.transformOrigin = `${offsetX}% ${offsetY}%`;
                img.style.transform = `scale(${newScale})`;
              }}
            />
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() =>
                  setLightboxIndex((i) =>
                    i !== null && i > 0 ? i - 1 : photos.length - 1,
                  )
                }
                className="btn-ghost px-6 py-3"
              >
                ← Previous
              </button>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Scroll to zoom</p>
              <button
                onClick={() =>
                  setLightboxIndex((i) =>
                    i !== null && i < photos.length - 1 ? i + 1 : 0,
                  )
                }
                className="btn-ghost px-6 py-3"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
