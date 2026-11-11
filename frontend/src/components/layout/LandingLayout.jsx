import { Outlet } from 'react-router-dom'
import NavPill from '@/components/NavPill'
import Footer from '@/components/Footer'

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-ground">
      <NavPill />
      <Outlet />
      <Footer />
    </div>
  )
}
