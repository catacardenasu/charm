import { useParams } from 'react-router-dom'

const TITLES: Record<string, string> = {
  profile: 'Edit profile',
  interests: 'Edit interests',
  saying: 'Edit saying',
}

// Placeholder for the Settings edit screens (Figma "Edit Profile" 49:2258, "Edit Interests" 49:1886,
// "Edit Line Screen" 49:2523).
export default function SettingsEdit() {
  const { section = '' } = useParams()
  return (
    <main>
      <h1>{TITLES[section] ?? 'Settings'}</h1>
    </main>
  )
}
