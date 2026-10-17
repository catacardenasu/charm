// Only same-app paths are allowed, so ?returnTo= can't send people to another site.
export function safeReturnTo(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export function onboardingPath(returnTo: string): string {
  return `/onboarding?returnTo=${encodeURIComponent(returnTo)}`
}
