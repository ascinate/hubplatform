import sqlite3
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from datetime import datetime, timedelta, timezone

TRACKING_DB = '/root/sankalp_backend/data/tracking.db'


def _raw(sql, params=None):
    """Run a raw SQL query against the SQLite tracking DB and return rows as dicts."""
    conn = sqlite3.connect(TRACKING_DB)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        cur.execute(sql, params or [])
        return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


@staff_member_required
def site_analytics(request):
    days = int(request.GET.get('days', 30))
    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')

    # ── KPI Summary ───────────────────────────────────────────────────────────
    summary = _raw("""
        SELECT
            COUNT(DISTINCT visitor_id)                          AS unique_visitors,
            COUNT(*)                                            AS total_sessions,
            ROUND(AVG(duration_seconds), 0)                    AS avg_duration,
            ROUND(
                100.0 * SUM(CASE WHEN page_count = 1 THEN 1 ELSE 0 END) / MAX(COUNT(*), 1),
                1
            )                                                   AS bounce_rate
        FROM sessions
        WHERE started_at >= ?
    """, [date_from])
    kpi = summary[0] if summary else {}

    pv = _raw("SELECT COUNT(*) AS total FROM page_views WHERE timestamp >= ?", [date_from])
    kpi['page_views'] = pv[0]['total'] if pv else 0

    rt_cutoff = (datetime.now(timezone.utc) - timedelta(minutes=5)).strftime('%Y-%m-%d %H:%M:%S')
    rt = _raw("SELECT COUNT(DISTINCT visitor_id) AS active FROM page_views WHERE timestamp >= ?", [rt_cutoff])
    kpi['active_now'] = rt[0]['active'] if rt else 0

    # ── Page Views Over Time ──────────────────────────────────────────────────
    pv_chart = _raw("""
        SELECT DATE(timestamp) AS day, COUNT(*) AS views
        FROM page_views WHERE timestamp >= ?
        GROUP BY day ORDER BY day
    """, [date_from])

    # ── Top Pages ─────────────────────────────────────────────────────────────
    top_pages = _raw("""
        SELECT page_url, page_title, COUNT(*) AS views,
               ROUND(AVG(time_on_page), 0) AS avg_time
        FROM page_views WHERE timestamp >= ?
        GROUP BY page_url, page_title
        ORDER BY views DESC LIMIT 20
    """, [date_from])

    # ── Geographic Distribution ───────────────────────────────────────────────
    geo = _raw("""
        SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS sessions
        FROM sessions WHERE started_at >= ? AND country IS NOT NULL
        GROUP BY country ORDER BY sessions DESC LIMIT 15
    """, [date_from])

    # ── Device Breakdown ──────────────────────────────────────────────────────
    devices = _raw("""
        SELECT COALESCE(device_type, 'Unknown') AS device_type, COUNT(*) AS sessions
        FROM sessions WHERE started_at >= ?
        GROUP BY device_type ORDER BY sessions DESC
    """, [date_from])

    browsers = _raw("""
        SELECT COALESCE(browser, 'Unknown') AS browser, COUNT(*) AS sessions
        FROM sessions WHERE started_at >= ?
        GROUP BY browser ORDER BY sessions DESC LIMIT 8
    """, [date_from])

    # ── Top Search Queries ────────────────────────────────────────────────────
    searches = _raw("""
        SELECT query, COUNT(*) AS count
        FROM search_events WHERE timestamp >= ?
        GROUP BY query ORDER BY count DESC LIMIT 15
    """, [date_from])

    # ── Recent Sessions ───────────────────────────────────────────────────────
    recent = _raw("""
        SELECT visitor_id, country, city, device_type, browser,
               entry_page, page_count, duration_seconds, started_at
        FROM sessions WHERE started_at >= ?
        ORDER BY started_at DESC LIMIT 50
    """, [date_from])

    # ── Top Referrers ─────────────────────────────────────────────────────────
    referrers = _raw("""
        SELECT COALESCE(referrer, 'Direct') AS referrer, COUNT(*) AS sessions
        FROM sessions WHERE started_at >= ?
        GROUP BY referrer ORDER BY sessions DESC LIMIT 10
    """, [date_from])

    return render(request, 'admin/site_analytics.html', {
        'title': 'Site Analytics',
        'kpi': kpi,
        'pv_chart': pv_chart,
        'top_pages': top_pages,
        'geo': geo,
        'devices': devices,
        'browsers': browsers,
        'searches': searches,
        'recent': recent,
        'referrers': referrers,
        'days': days,
        'date_from': date_from[:10],
    })
