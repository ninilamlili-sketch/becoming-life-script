import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Consent from './pages/Consent'
import Quiz from './pages/Quiz'
import Explore from './pages/Explore'
import Report from './pages/Report'

/** Product is mobile-only; desktop just shows a centered phone column. */
export default function App() {
  return (
    <div className="min-h-screen bg-[#E9E8E1] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-cream shadow-[0_0_40px_rgba(57,58,53,0.05)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </div>
    </div>
  )
}
