import { Outlet } from 'react-router-dom'
import AnnouncementBar from '@/components/AnnouncementBar'
import NavPill from '@/components/NavPill'
import Footer from '@/components/Footer'

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-ground">
      <AnnouncementBar />
      <NavPill />
      <Outlet />
      <Footer />
    </div>
  )
}
