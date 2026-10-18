import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onboardingPath } from '../lib/returnTo.ts'
import type { Profile } from '../types.ts'
import { useMyProfile } from './useMyProfile.ts'
import { useSaveProfile, type ProfileFields } from './useSaveProfile.ts'

export const profileFields = (p: Profile): ProfileFields => ({
  nickname: p.nickname,
  major: p.major,
  year: p.year,
  interests: p.interests,
  greeting: p.greeting,
  avatar: p.avatar,
})

/** Shared by the Settings edit screens: load my profile, save changes over it, go back to /settings. */
export function useProfileEditor() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const { profile, loading } = useMyProfile()
  const { saveProfile, saving } = useSaveProfile()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const ready = !authLoading && !loading
  const redirect = !ready ? null : !isAuthenticated ? '/' : !profile ? onboardingPath('/settings') : null

  const save = async (changes: Partial<ProfileFields>) => {
    if (!profile) return
    setError(null)
    const fields = { ...profileFields(profile), ...changes }
    try {
      await saveProfile({
        ...fields,
        nickname: fields.nickname.trim(),
        major: fields.major?.trim() || null,
        greeting: fields.greeting?.trim() || null,
      })
      navigate('/settings', { replace: true })
    } catch (e) {
      const { message, code } = e as { message?: string; code?: string }
      const detail = [message || 'Unknown error', code && `(code ${code})`].filter(Boolean).join(' ')
      setError(`Couldn't save. Try again.\n${detail}`)
    }
  }

  return { profile, ready, redirect, save, saving, error, back: () => navigate('/settings') }
}
