// "Link your charm" (last onboarding step) sets this flag, then the user taps their own keychain.
// The NFC link opens /k/:code (often in a new Safari tab, same storage), which sees the flag and
// claims the keychain without asking. localStorage can throw in private mode, so every access is guarded.
const LINKING_KEY = 'charm:linking'
const LINKING_MAX_AGE_MS = 10 * 60 * 1000

export function startLinking() {
  try {
    localStorage.setItem(LINKING_KEY, String(Date.now()))
  } catch {
    // Storage unavailable: /k/:code just shows the normal Claim screen.
  }
}

export function clearLinking() {
  try {
    localStorage.removeItem(LINKING_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** True if Link your charm was opened in the last 10 minutes. */
export function isLinkingRecent(): boolean {
  try {
    const startedAt = Number(localStorage.getItem(LINKING_KEY))
    return startedAt > 0 && Date.now() - startedAt < LINKING_MAX_AGE_MS
  } catch {
    return false
  }
}
