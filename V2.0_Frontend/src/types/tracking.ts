export interface TrackingEvent {
  event_type: 'page_view' | 'click' | 'search' | 'session_start' | 'session_end' | 'custom'
  visitor_id: string
  session_id: string
  timestamp: string
  page_url: string
  page_title?: string
  referrer?: string
  // Click-specific
  element_selector?: string
  click_x?: number
  click_y?: number
  // Search-specific
  search_query?: string
  search_results_count?: number
  // Custom event
  event_category?: string
  event_action?: string
  event_label?: string
  event_value?: number
  // Device info
  user_agent: string
  screen_width: number
  screen_height: number
  language: string
  // Session info
  time_on_page?: number
}

export interface VisitorAnalyticsSummary {
  total_visitors: number
  total_page_views: number
  unique_visitors: number
  avg_session_duration: number
  bounce_rate: number
  top_referrer: string
}

export interface PageViewData {
  page_url: string
  views: number
  unique_visitors: number
  avg_time_on_page: number
  bounce_rate: number
}

export interface PageViewTimeSeries {
  date: string
  visitors: number
  page_views: number
}

export interface GeoDistribution {
  country: string
  city?: string
  visitors: number
  percentage: number
}

export interface DeviceBreakdown {
  device_type: 'desktop' | 'mobile' | 'tablet'
  count: number
  percentage: number
}

export interface BrowserBreakdown {
  browser: string
  count: number
  percentage: number
}

export interface SearchQueryData {
  query: string
  count: number
  page_url: string
}

export interface ClickData {
  element_selector: string
  page_url: string
  click_count: number
}

export interface RealTimeData {
  active_sessions: number
  current_pages: { page_url: string; count: number }[]
}
