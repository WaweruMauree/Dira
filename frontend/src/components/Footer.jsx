import { Link } from 'react-router-dom'
import DiraLogo from '@/components/DiraLogo'

export default function Footer() {
  return (
    <footer className="py-10 px-4 border-t border-hairline/60">
      <div className="max-w-[820px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-ink">
          <DiraLogo size={20} />
          <span className="text-sm font-medium">Dira</span>
        </Link>
        <p className="text-muted text-xs">
          © 2026 Dira. Career intelligence for the next generation.
        </p>
      </div>
    </footer>
  )
}
