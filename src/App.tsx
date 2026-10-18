import { Navigate, Route, Routes } from 'react-router-dom'
import ComponentGallery from './dev/ComponentGallery.tsx'
import ScreensPreview from './dev/ScreensPreview.tsx'
import { NavLayout } from './components/NavLayout.tsx'
import Activity from './pages/Activity.tsx'
import Closet from './pages/Closet.tsx'
import Home from './pages/Home.tsx'
import Keychain from './pages/Keychain.tsx'
import Me from './pages/Me.tsx'
import NotFound from './pages/NotFound.tsx'
import Onboarding from './pages/Onboarding.tsx'
import Plaza from './pages/Plaza.tsx'
import Review from './pages/Review.tsx'
import Settings from './pages/Settings.tsx'
import { EditInterests, EditLine, EditProfile } from './pages/SettingsEdit.tsx'
import Shop from './pages/Shop.tsx'
import UserDetail from './pages/UserDetail.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/k/:code" element={<Keychain />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/plaza/:locationId?" element={<Plaza />} />
      <Route path="/u/:userId" element={<UserDetail />} />
      {/* Bottom nav pages. /plaza draws its own nav (edge-to-edge map). */}
      <Route element={<NavLayout />}>
        <Route path="/activity" element={<Activity />} />
        <Route path="/streaks" element={<Navigate to="/activity?tab=streaks" replace />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/closet" element={<Closet />} />
        <Route path="/me" element={<Me />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      {/* Settings edit screens: full-screen forms, no nav (Figma 49:2258, 49:1886, 49:2523). */}
      <Route path="/settings/profile" element={<EditProfile />} />
      <Route path="/settings/interests" element={<EditInterests />} />
      <Route path="/settings/line" element={<EditLine />} />
      <Route path="/review" element={<Review />} />
      <Route path="/dev" element={<ComponentGallery />} />
      <Route path="/dev/screens" element={<ScreensPreview />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
