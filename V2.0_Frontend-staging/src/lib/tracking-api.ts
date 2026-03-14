import type { TrackingEvent } from '@/types/tracking'

const TRACKING_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.sankalphub.in/api'

export function sendTrackingEvents(events: TrackingEvent[]) {
  if (events.length === 0) return

  const payload = JSON.stringify({ events })

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon(`${TRACKING_URL}/tracking/events/`, blob)
    } else {
      fetch(`${TRACKING_URL}/tracking/events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silently fail — tracking should never break the app
      })
    }
  } catch {
    // Silently fail
  }
}
