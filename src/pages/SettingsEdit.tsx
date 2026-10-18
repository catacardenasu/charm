import { useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import AboutStep from '../components/onboarding/AboutStep.tsx'
import GreetingStep from '../components/onboarding/GreetingStep.tsx'
import InterestsStep from '../components/onboarding/InterestsStep.tsx'
import { profileFields, useProfileEditor } from '../hooks/useProfileEditor.ts'
import type { Profile } from '../types.ts'

// The Settings edit screens reuse the onboarding steps with their own title, no progress bar and "Done".
// Figma: "Edit Profile" (49:2258), "Edit Interests" (49:1886), "Edit Line Screen" (49:2523).

type Editor = ReturnType<typeof useProfileEditor>

/** Waits for the profile, so each form can start its draft from it. */
function WithProfile({ children }: { children: (editor: Editor, profile: Profile) => ReactNode }) {
  const editor = useProfileEditor()
  if (!editor.ready) return <p>Loading…</p>
  if (editor.redirect) return <Navigate to={editor.redirect} replace />
  return <>{children(editor, editor.profile!)}</>
}

const doneLabel = (saving: boolean) => (saving ? 'Saving…' : 'Done')

/** /settings/profile: nickname, major, year. */
export function EditProfile() {
  return <WithProfile>{(editor, profile) => <EditProfileForm editor={editor} profile={profile} />}</WithProfile>
}

function EditProfileForm({ editor, profile }: { editor: Editor; profile: Profile }) {
  const [draft, setDraft] = useState(() => profileFields(profile))
  return (
    <AboutStep
      title="Edit Profile"
      progress={false}
      draft={draft}
      onChange={(changes) => setDraft((d) => ({ ...d, ...changes }))}
      onBack={editor.back}
      onNext={() => editor.save({ nickname: draft.nickname, major: draft.major, year: draft.year })}
      nextLabel={doneLabel(editor.saving)}
      nextDisabled={editor.saving}
      error={editor.error}
    />
  )
}

/** /settings/interests */
export function EditInterests() {
  return <WithProfile>{(editor, profile) => <EditInterestsForm editor={editor} profile={profile} />}</WithProfile>
}

function EditInterestsForm({ editor, profile }: { editor: Editor; profile: Profile }) {
  const [interests, setInterests] = useState(profile.interests)
  return (
    <InterestsStep
      title="Edit Interests"
      progress={false}
      interests={interests}
      onChange={setInterests}
      onBack={editor.back}
      onNext={() => editor.save({ interests })}
      nextLabel={doneLabel(editor.saving)}
      nextDisabled={editor.saving}
      error={editor.error}
    />
  )
}

/** /settings/line: the greeting ("saying"). */
export function EditLine() {
  return <WithProfile>{(editor, profile) => <EditLineForm editor={editor} profile={profile} />}</WithProfile>
}

function EditLineForm({ editor, profile }: { editor: Editor; profile: Profile }) {
  const [greeting, setGreeting] = useState(profile.greeting ?? '')
  return (
    <GreetingStep
      title="Edit your saying"
      progress={false}
      greeting={greeting}
      avatar={profile.avatar}
      onChange={setGreeting}
      onBack={editor.back}
      onFinish={() => editor.save({ greeting })}
      saving={editor.saving}
      error={editor.error}
      nextLabel="Done"
    />
  )
}
