import { Route, Routes } from 'react-router-dom'
import ComponentGallery from './dev/ComponentGallery.tsx'
import ScreensPreview from './dev/ScreensPreview.tsx'
import Home from './pages/Home.tsx'
import Keychain from './pages/Keychain.tsx'
import NotFound from './pages/NotFound.tsx'
import Onboarding from './pages/Onboarding.tsx'
import Plaza from './pages/Plaza.tsx'
import Review from './pages/Review.tsx'
import Settings from './pages/Settings.tsx'
import Shop from './pages/Shop.tsx'
import Streaks from './pages/Streaks.tsx'
import UserDetail from './pages/UserDetail.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/k/:code" element={<Keychain />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/plaza/:locationId?" element={<Plaza />} />
      <Route path="/u/:userId" element={<UserDetail />} />
      <Route path="/streaks" element={<Streaks />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/review" element={<Review />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/dev" element={<ComponentGallery />} />
      <Route path="/dev/screens" element={<ScreensPreview />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
