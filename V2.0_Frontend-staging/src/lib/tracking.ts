import type { TrackingEvent } from '@/types/tracking'
import { useCookieConsentStore } from './cookie-consent-store'
import { sendTrackingEvents } from './tracking-api'

const VISITOR_ID_KEY = 'sankalp_visitor_id'
const SESSION_ID_KEY = 'sankalp_session_id'
const SESSION_TIMESTAMP_KEY = 'sankalp_session_ts'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

let eventBuffer: TrackingEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(VISITOR_ID_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(VISITOR_ID_KEY, id)
  }
  return id
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  const now = Date.now()
  const lastActivity = localStorage.getItem(SESSION_TIMESTAMP_KEY)
  let sessionId = localStorage.getItem(SESSION_ID_KEY)

  if (!sessionId || !lastActivity || now - parseInt(lastActivity) > SESSION_TIMEOUT_MS) {
    sessionId = generateId()
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  }

  localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString())
  return sessionId
}

function isTrackingAllowed(): boolean {
  const state = useCookieConsentStore.getState()
  return state.analyticsCookies === true
}

function createBaseEvent(eventType: TrackingEvent['event_type']): TrackingEvent {
  return {
    event_type: eventType,
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
    page_url: window.location.pathname,
    page_title: document.title,
    referrer: document.referrer || undefined,
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    language: navigator.language,
  }
}

function queueEvent(event: TrackingEvent) {
  eventBuffer.push(event)

  // Start flush timer if not running
  if (!flushTimer) {
    flushTimer = setInterval(flushEvents, 5000)
  }
}

function flushEvents() {
  if (eventBuffer.length === 0) return
  const events = [...eventBuffer]
  eventBuffer = []
  sendTrackingEvents(events)
}

export function trackPageView(url: string, title: string) {
  if (!isTrackingAllowed()) return
  const event = createBaseEvent('page_view')
  event.page_url = url
  event.page_title = title
  queueEvent(event)
}

export function trackClick(elementSelector: string, position: { x: number; y: number }, pageUrl: string) {
  if (!isTrackingAllowed()) return
  const event = createBaseEvent('click')
  event.element_selector = elementSelector
  event.click_x = position.x
  event.click_y = position.y
  event.page_url = pageUrl
  queueEvent(event)
}

export function trackSearch(query: string, resultsCount: number) {
  if (!isTrackingAllowed()) return
  const event = createBaseEvent('search')
  event.search_query = query
  event.search_results_count = resultsCount
  queueEvent(event)
}

export function trackEvent(category: string, action: string, label?: string, value?: number) {
  if (!isTrackingAllowed()) return
  const event = createBaseEvent('custom')
  event.event_category = category
  event.event_action = action
  event.event_label = label
  event.event_value = value
  queueEvent(event)
}

export function getCSSSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`

  const tag = el.tagName.toLowerCase()
  const classes = Array.from(el.classList).slice(0, 3).join('.')

  if (classes) return `${tag}.${classes}`

  const parent = el.parentElement
  if (parent) {
    const children = Array.from(parent.children)
    const index = children.indexOf(el)
    return `${getCSSSelector(parent)} > ${tag}:nth-child(${index + 1})`
  }

  return tag
}

export function initTracking() {
  if (typeof window === 'undefined') return

  // Flush on page unload
  window.addEventListener('beforeunload', flushEvents)

  // Flush on visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEvents()
    }
  })
}

export function cleanupTracking() {
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
  flushEvents()
  window.removeEventListener('beforeunload', flushEvents)
}
