import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Home, LogOut, MessageSquare, Plus, Briefcase } from 'lucide-react'
import DiraLogo from '@/components/DiraLogo'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AGENT_MODES } from '@/lib/agent/tools/registry'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/career-guidance/new', label: 'Career Guidance', icon: Compass, mode: 'career_guidance' },
  { to: '/jobs/new', label: 'Job Search', icon: Briefcase, mode: 'job_aggregation' },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ground flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-hairline bg-card-bg">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-hairline">
          <DiraLogo size={24} className="text-ink" />
          <span className="font-medium text-ink">Dira</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                location.pathname.startsWith(to.replace('/new', ''))
                  ? 'bg-accent/20 text-ink font-medium'
                  : 'text-muted hover:text-ink hover:bg-secondary/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-hairline space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="accent" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/chat/new')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {AGENT_MODES.general.label}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/career-guidance/new')}>
                <Compass className="h-4 w-4 mr-2" />
                {AGENT_MODES.career_guidance.label}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/jobs/new')}>
                <Briefcase className="h-4 w-4 mr-2" />
                {AGENT_MODES.job_aggregation.label}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-hairline bg-card-bg">
          <Link to="/home" className="flex items-center gap-2 text-ink">
            <DiraLogo size={22} />
            <span className="font-medium text-sm">Dira</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
