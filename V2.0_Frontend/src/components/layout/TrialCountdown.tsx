'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

// Smooth 4-zone color interpolation: Green → Yellow → Orange → Red
function getTrialColor(progress: number): string {
  // progress: 0 = just started, 1 = expired
  const p = Math.max(0, Math.min(1, progress))
  const zones: [number, number, number][] = [
    [34, 197, 94],   // #22C55E green
    [234, 179, 8],   // #EAB308 yellow
    [249, 115, 22],  // #F97316 orange
    [239, 68, 68],   // #EF4444 red
  ]
  const seg = p * (zones.length - 1)
  const i = Math.min(Math.floor(seg), zones.length - 2)
  const t = seg - i
  const r = Math.round(zones[i][0] + (zones[i + 1][0] - zones[i][0]) * t)
  const g = Math.round(zones[i][1] + (zones[i + 1][1] - zones[i][1]) * t)
  const b = Math.round(zones[i][2] + (zones[i + 1][2] - zones[i][2]) * t)
  return `rgb(${r},${g},${b})`
}

export default function TrialCountdown() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [now, setNow] = useState(Date.now())
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const org = user?.organization
  const trialEnd = org?.trial_end ? new Date(org.trial_end).getTime() : null
  const isTrial = org?.plan === 'free' && trialEnd

  useEffect(() => {
    if (!isTrial) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [isTrial])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!isTrial || !trialEnd) return null

  const totalMs = 21 * 24 * 60 * 60 * 1000
  const remaining = Math.max(0, trialEnd - now)
  const elapsed = totalMs - remaining
  const progress = Math.min(1, elapsed / totalMs)
  const expired = remaining <= 0

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  const color = getTrialColor(progress)
  const critical = days <= 3 && !expired

  // Clock math (36px SVG, viewBox 0 0 36 36)
  const cx = 18, cy = 18, r = 15
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - progress)
  const hourAngle = (hours / 12) * 360
  const minuteAngle = (minutes / 60) * 360
  const secondAngle = (seconds / 60) * 360

  const handleClick = () => {
    if (expired) {
      router.push('/billing')
    } else {
      setOpen(!open)
    }
  }

  const tooltipText = expired
    ? 'Trial expired — click to upgrade'
    : `${days} day${days !== 1 ? 's' : ''} left of 21-day free trial`

  const daysLabel = expired ? 'Expired' : `${days}d`
  const daysWeight = expired
    ? 'font-extrabold text-red-500'
    : critical
      ? 'font-bold'
      : 'font-medium text-text-muted'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleClick}
        title={tooltipText}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* 36px analog clock */}
        <div className={critical || expired ? 'animate-pulse' : ''}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            {/* Background ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="2" />
            {/* Progress arc */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-1000"
            />
            {/* Hour marks */}
            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg - 90) * (Math.PI / 180)
              const x1 = cx + (r - 2) * Math.cos(rad)
              const y1 = cy + (r - 2) * Math.sin(rad)
              const x2 = cx + (r - 4) * Math.cos(rad)
              const y2 = cy + (r - 4) * Math.sin(rad)
              return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D1D5DB" strokeWidth="0.8" />
            })}
            {/* Center dot */}
            <circle cx={cx} cy={cy} r="1.2" fill="#374151" />
            {/* Hour hand */}
            <line
              x1={cx} y1={cy}
              x2={cx + 7 * Math.sin(hourAngle * Math.PI / 180)}
              y2={cy - 7 * Math.cos(hourAngle * Math.PI / 180)}
              stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
            />
            {/* Minute hand */}
            <line
              x1={cx} y1={cy}
              x2={cx + 10 * Math.sin(minuteAngle * Math.PI / 180)}
              y2={cy - 10 * Math.cos(minuteAngle * Math.PI / 180)}
              stroke="#374151" strokeWidth="1" strokeLinecap="round"
            />
            {/* Second hand */}
            <line
              x1={cx} y1={cy}
              x2={cx + 12 * Math.sin(secondAngle * Math.PI / 180)}
              y2={cy - 12 * Math.cos(secondAngle * Math.PI / 180)}
              stroke={color} strokeWidth="0.6" strokeLinecap="round"
            />
          </svg>
        </div>
        <span className={`text-xs ${daysWeight} whitespace-nowrap`}>{daysLabel}</span>
      </button>

      {/* Dropdown panel */}
      {open && !expired && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-elevated border border-border-light z-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">Free Trial</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: color }}
            />
          </div>

          {/* Countdown */}
          <div className="font-mono text-sm font-bold text-text-primary mb-0.5">
            {String(days).padStart(2, '0')}d {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m remaining
          </div>
          <div className="text-[11px] text-text-muted mb-3">
            of 21-day trial
          </div>

          {/* CTA */}
          <a
            href="/billing"
            className="block text-center text-xs font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            {critical ? 'Upgrade Now' : 'View Plans'}
          </a>
        </div>
      )}
    </div>
  )
}
