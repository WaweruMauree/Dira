import { Outlet } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'
import DiraLogo from '@/components/DiraLogo'
import { Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-ground flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-ink">
          <DiraLogo size={24} />
          <span className="font-medium">Dira</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <Outlet />
      </main>
    </div>
  )
}
