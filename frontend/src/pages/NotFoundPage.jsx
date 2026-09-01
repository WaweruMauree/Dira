import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-4">404</p>
      <h1 className="font-heading text-4xl font-medium text-ink mb-3">Page not found</h1>
      <p className="text-muted mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button variant="accent" asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
