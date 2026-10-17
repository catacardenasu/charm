import { createContext, useContext } from 'react'

// Bumped whenever something changes who's in the plaza (e.g. a Realtime tap in).
// Plaza data hooks include it in their fetch key so they reload.
export const PlazaRefreshContext = createContext(0)

export function usePlazaVersion() {
  return useContext(PlazaRefreshContext)
}
