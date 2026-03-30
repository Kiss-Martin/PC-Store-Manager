/**
 * Shared token storage utilities.
 *
 * Canonical key: `pc_token` in localStorage (persistent) or sessionStorage (tab-only).
 */

const TOKEN_KEY = 'pc_token';
const USER_KEY = 'pc_user';
const REMEMBER_KEY = 'pc_remember';

/** Retrieve the current access token from whichever storage has it. */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

/** Retrieve the stored user JSON string. */
export function getStoredUser(): string | null {
  return localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY) || null;
}

/** Persist auth data to the appropriate storage. */
export function storeAuth(token: string, userJson: string, remember: boolean): void {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;

  target.setItem(TOKEN_KEY, token);
  target.setItem(USER_KEY, userJson);

  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }

  // Remove from the other storage to avoid ambiguity
  other.removeItem(TOKEN_KEY);
  other.removeItem(USER_KEY);
}

/** Remove all auth data from both storages. */
export function clearStoredAuth(preserveRemember = false): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  // Legacy key cleanup (one-time migration)
  localStorage.removeItem('token');
  localStorage.removeItem('pc_token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('pc_token');
  sessionStorage.removeItem('user');

  if (!preserveRemember) {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function shouldRestoreSession(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === 'true';
}

export { TOKEN_KEY, USER_KEY, REMEMBER_KEY };
