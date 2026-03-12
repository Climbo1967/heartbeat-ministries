// Netlify serverless function — saves prayer request to Supabase
// This runs server-side so no browser extensions/blockers can interfere

const SB_URL = 'https://qtugmhjvpghlhmthnzog.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdtaGp2cGdobGhtdGhuem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTIzMjEsImV4cCI6MjA4NTQyODMyMX0.aEj3zIF8yJj0Gf1fxbp1O1Uv3Opd-qDaa5CocXEuCc4';

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, request, privacy, urgent } = data;

    if (!request) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Request text is required' }) };
    }

    const res = await fetch(SB_URL + '/rest/v1/prayer_requests', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: name || '',
        email: email || '',
        request: request,
        privacy: privacy || 'private',
        urgent: urgent || false
      })
    });

    const body = await res.text();
    console.log('Supabase response:', res.status, body);

    if (!res.ok) {
      return { statusCode: res.status, body: body };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: body
    };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
