export function getUserDisplayName(user) {
  return firstPresent(user?.displayName, user?.name, user?.username, 'GitHub user');
}

export function getUserUsername(user) {
  const username = firstPresent(user?.username, user?.login);
  return username ? `@${String(username).replace(/^@/, '')}` : 'Not connected';
}

export function getUserEmail(user) {
  return firstPresent(user?.email, 'Not provided by GitHub');
}

export function getUserInitials(user) {
  const value = firstPresent(user?.displayName, user?.name, user?.username, user?.login, 'GH');
  const initials = String(value)
    .replace(/^@/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'GH';
}

function firstPresent(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}
