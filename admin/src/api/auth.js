// Netlify Identity auth helpers
// Relies on netlifyIdentity global from CDN script

export function getCurrentUser() {
  return window.netlifyIdentity && window.netlifyIdentity.currentUser();
}

export async function getJwt() {
  const user = getCurrentUser();
  if (!user) throw new Error('Not logged in');
  const token = await user.jwt();
  return token;
}

export function logout() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  }
}

export function getUserEmail() {
  const user = getCurrentUser();
  return user ? user.email : '';
}
