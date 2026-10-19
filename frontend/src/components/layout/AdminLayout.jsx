import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import DiraLogo from '@/components/DiraLogo'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthProvider'
import { cn } from '@/lib/utils'
import RouterAuthFlashBar from '@/components/auth/RouterAuthFlashBar'

const navItems = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/students', label: 'Manage Student Accounts' },
  { to: '/admin/moderation', label: 'Moderate Opportunity Listings' },
  { to: '/admin/audit-logs', label: 'Audit Access Logs' },
  { to: '/admin/usage-reports', label: 'Generate Usage Reports' },
  { to: '/admin/system', label: 'Monitor System Performance' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { signOut, profile } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ground flex flex-col">
      <header className="border-b border-hairline bg-card-bg px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-2">
            <DiraLogo className="h-7 w-auto" />
            <span className="font-heading font-medium text-ink hidden sm:inline">Dira</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-bold">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-sm text-muted hidden md:inline truncate max-w-[140px]">
            {profile?.full_name || 'Admin'}
          </span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 border-r border-hairline p-3 hidden md:block">
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent/15 text-ink font-medium border border-accent/30'
                      : 'text-muted hover:text-ink hover:bg-secondary/40'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <RouterAuthFlashBar />
          <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
