import { Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import Consent from './pages/Consent'
import Explore from './pages/Explore'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Redeem from './pages/Redeem'
import Report from './pages/Report'

/** Product is mobile-only; desktop just shows a centered phone column. */
export default function App() {
  return (
    <div className="min-h-screen bg-[#E9E8E1] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-cream shadow-[0_0_40px_rgba(57,58,53,0.05)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/redeem" element={<Redeem />} />
          <Route
            path="/consent"
            element={
              <RequireAuth>
                <Consent />
              </RequireAuth>
            }
          />
          <Route
            path="/quiz"
            element={
              <RequireAuth>
                <Quiz />
              </RequireAuth>
            }
          />
          <Route
            path="/explore"
            element={
              <RequireAuth>
                <Explore />
              </RequireAuth>
            }
          />
          <Route
            path="/report"
            element={
              <RequireAuth>
                <Report />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </div>
  )
}
