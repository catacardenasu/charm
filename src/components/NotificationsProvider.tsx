import { useAuth0 } from '@auth0/auth0-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { PlazaRefreshContext } from '../lib/plazaRefresh.ts'
import { useSupabase } from '../lib/supabase.ts'
import type { AppNotification, TapInNotificationPayload } from '../types.ts'
import Toasts, { type ToastMessage } from './Toasts.tsx'

/**
 * Mounted once at the app root. Listens for the current user's new `notifications`
 * rows over Realtime; on a tap in, shows a toast and bumps the plaza refresh version.
 */
export default function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth0()
  const supabase = useSupabase()
  const sub = isAuthenticated ? user?.sub : undefined
  const [plazaVersion, setPlazaVersion] = useState(0)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismiss = useCallback((id: string) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  useEffect(() => {
    if (!sub) return
    let channel: RealtimeChannel | null = null
    let cancelled = false

    const onInsert = (notification: AppNotification) => {
      if (notification.type !== 'tap_in') return
      const { from_nickname } = notification.payload as Partial<TapInNotificationPayload>
      setToasts((ts) => [...ts, { id: notification.id, text: `${from_nickname ?? 'Someone'} tapped in with you!` }])
      setPlazaVersion((v) => v + 1)
    }

    // Send the Auth0 token before subscribing so RLS lets this user's rows through.
    supabase.realtime.setAuth().then(() => {
      if (cancelled) return
      channel = supabase
        .channel(`notifications:${sub}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${sub}` },
          (change) => onInsert(change.new as AppNotification),
        )
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, sub])

  return (
    <PlazaRefreshContext value={plazaVersion}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </PlazaRefreshContext>
  )
}
