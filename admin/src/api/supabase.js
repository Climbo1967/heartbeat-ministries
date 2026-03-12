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
