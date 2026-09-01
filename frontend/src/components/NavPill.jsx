import { useState } from 'react'
import { Link } from 'react-router-dom'
import DiraLogo from '@/components/DiraLogo'
import ThemeToggle from '@/components/ThemeToggle'

const navLinks = [
  { label: 'Product', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'About Us', href: '#about-us' },
]

export default function NavPill() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[820px]">
      <div className="bg-card-bg rounded-2xl border border-hairline shadow-[0_2px_8px_rgba(0,0,0,.06)] px-4 py-2.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0 text-ink">
          <DiraLogo size={28} />
          <span className="font-medium text-base tracking-tight hidden sm:inline">Dira</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-muted hover:text-ink text-sm font-normal px-3 py-1.5 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle className="hidden sm:flex" />
          <Link
            to="/login"
            className="text-ink text-sm font-normal px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors hidden sm:inline-block"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="bg-accent text-ink text-sm font-medium px-4 py-2 rounded-full hover:brightness-95 transition-all"
          >
            Sign Up
          </Link>

          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {mobileOpen ? (
                <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card-bg rounded-2xl border border-hairline shadow-lg mt-2 px-4 py-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-muted hover:text-ink text-sm font-normal px-3 py-2.5 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-hairline mt-2 pt-2 flex items-center justify-between">
            <Link to="/login" className="block text-ink text-sm font-normal px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
              Log in
            </Link>
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  )
}
