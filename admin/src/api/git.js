// Git Gateway API helpers for reading/writing content files
// Uses Netlify Git Gateway (proxied GitHub API)

import { getJwt } from './auth.js';

const GW = '/.netlify/git/github/contents/';

// UTF-8 safe base64 encode (btoa fails on non-ASCII)
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// UTF-8 safe base64 decode
function base64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Get a single file (returns { content, sha })
export async function getFile(path) {
  const jwt = await getJwt();
  const res = await fetch(GW + path, {
    headers: { Authorization: 'Bearer ' + jwt }
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Git Gateway GET failed: ' + res.status);
  }
  const data = await res.json();
  return {
    content: base64ToUtf8(data.content),
    sha: data.sha
  };
}

// Write/update a file
export async function putFile(path, content, sha, message) {
  const jwt = await getJwt();
  const body = {
    message: message || 'Update ' + path,
    content: utf8ToBase64(content)
  };
  if (sha) body.sha = sha;
  const res = await fetch(GW + path, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Git Gateway PUT failed: ' + res.status + ' ' + text);
  }
  return await res.json();
}

// Delete a file
export async function deleteFile(path, sha, message) {
  const jwt = await getJwt();
  const res = await fetch(GW + path, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message || 'Delete ' + path,
      sha: sha
    })
  });
  if (!res.ok) throw new Error('Git Gateway DELETE failed: ' + res.status);
  return true;
}

// List files in a directory (returns array of { name, path, sha })
export async function listDir(dirPath) {
  const jwt = await getJwt();
  const res = await fetch(GW + dirPath, {
    headers: { Authorization: 'Bearer ' + jwt }
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error('Git Gateway LIST failed: ' + res.status);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(f => ({ name: f.name, path: f.path, sha: f.sha }));
}
