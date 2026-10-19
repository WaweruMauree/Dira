import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Home, LogOut, MessageSquare, Plus, Briefcase, User, Map } from 'lucide-react'
import DiraLogo from '@/components/DiraLogo'
import ThemeToggle from '@/components/ThemeToggle'
import UserAvatar from '@/components/profile/UserAvatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthProvider'
import { getDisplayName } from '@/lib/profile/generateAbout'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AGENT_MODES } from '@/lib/agent/tools/registry'
import { cn } from '@/lib/utils'
import RouterAuthFlashBar from '@/components/auth/RouterAuthFlashBar'
import { StudentAppDataProvider } from '@/context/StudentAppDataProvider'

const navItems = [
  { to: '/home', label: 'Home', icon: Home, match: (p) => p === '/home' },
  { to: '/profile', label: 'Profile', icon: User, match: (p) => p.startsWith('/profile') },
  {
    to: '/jobs',
    label: 'Job Search',
    icon: Briefcase,
    mode: 'job_aggregation',
    match: (p) => p.startsWith('/jobs'),
  },
  {
    to: '/skills-analysis',
    label: 'Skills Analysis',
    icon: Compass,
    mode: 'career_guidance',
    match: (p) => p.startsWith('/skills-analysis') || p.startsWith('/career-guidance'),
  },
  {
    to: '/career-pathway',
    label: 'Career Pathway',
    icon: Map,
    match: (p) => p.startsWith('/career-pathway'),
  },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, profile, meSnapshot } = useAuth()

  const displayName = meSnapshot ? getDisplayName(meSnapshot) : profile?.full_name || 'Student'

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
          {navItems.map(({ to, label, icon: Icon, match }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                match(location.pathname)
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
              <DropdownMenuItem onClick={() => navigate('/skills-analysis')}>
                <Compass className="h-4 w-4 mr-2" />
                {AGENT_MODES.career_guidance.label}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/jobs')}>
                <Briefcase className="h-4 w-4 mr-2" />
                {AGENT_MODES.job_aggregation.label}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/profile"
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-secondary/50 transition-colors"
          >
            <UserAvatar profile={profile} size={36} />
            <span className="text-sm font-medium text-ink truncate flex-1">{displayName}</span>
          </Link>

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
            <Link to="/profile" className="mr-1">
              <UserAvatar profile={profile} size={32} />
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <RouterAuthFlashBar />
          <div className="flex-1 overflow-y-auto min-h-0">
            <StudentAppDataProvider>
              <Outlet />
            </StudentAppDataProvider>
          </div>
        </main>
      </div>
    </div>
  )
}
