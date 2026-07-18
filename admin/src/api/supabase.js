// Supabase client for prayer requests
// Project: qtugmhjvpghlhmthnzog

const SUPABASE_URL = 'https://qtugmhjvpghlhmthnzog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdtaGp2cGdobGhtdGhuem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTIzMjEsImV4cCI6MjA4NTQyODMyMX0.aEj3zIF8yJj0Gf1fxbp1O1Uv3Opd-qDaa5CocXEuCc4';

// Simple REST client (avoids bundling full supabase-js for browser)
async function supabaseRequest(path, options = {}) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || '',
      ...options.headers
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Supabase error: ' + res.status + ' ' + text);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('json')) {
    return await res.json();
  }
  return null;
}

export async function fetchPrayers() {
  return supabaseRequest('prayer_requests?select=*&order=created_at.desc');
}

export async function updatePrayerStatus(id, status) {
  return supabaseRequest('prayer_requests?id=eq.' + id, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: JSON.stringify({ status })
  });
}

export async function deletePrayer(id) {
  return supabaseRequest('prayer_requests?id=eq.' + id, {
    method: 'DELETE'
  });
}

// Total site views (lifetime, includes bots/refreshes). Public pages
// increment it via the log_page_view RPC; shown only here in the admin.
export async function fetchSiteViews() {
  const rows = await supabaseRequest("site_counter?id=eq.total&select=views");
  return (rows && rows[0] && rows[0].views) || 0;
}

// ── Visitor tracking (page_views table, bots excluded) ──
// Aggregate-only RPCs; raw rows are not anon-readable.

// Per-page views + unique visitors for the last N days.
export async function fetchPageStats(days = 7) {
  return supabaseRequest('rpc/page_view_stats', {
    method: 'POST',
    body: JSON.stringify({ p_days: days })
  });
}

// Overall views + unique visitors for the last N days.
export async function fetchViewSummary(days = 7) {
  const rows = await supabaseRequest('rpc/page_view_summary', {
    method: 'POST',
    body: JSON.stringify({ p_days: days })
  });
  return (rows && rows[0]) || { views: 0, visitors: 0 };
}

// Per-day views + visitors (zero-filled, Central time) for the last N days.
export async function fetchDailyViews(days = 7) {
  return supabaseRequest('rpc/page_view_daily', {
    method: 'POST',
    body: JSON.stringify({ p_days: days })
  });
}

// Top traffic sources for the last N days ('(direct)' = typed/bookmark).
export async function fetchTopReferrers(days = 30) {
  return supabaseRequest('rpc/page_view_referrers', {
    method: 'POST',
    body: JSON.stringify({ p_days: days })
  });
}
