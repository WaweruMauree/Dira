import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="text-center px-4 pt-32 pb-12 md:pt-40 md:pb-16 max-w-[720px] mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-5">
        Intelligence meets opportunity
      </p>

      <h1 className="font-heading text-[40px] sm:text-[52px] md:text-[68px] font-medium leading-[1.05] tracking-tight text-ink mb-6">
        Your career{' '}
        <span className="relative inline-block">
          intelligence
          <span className="absolute bottom-1 left-0 w-full h-[6px] bg-accent -z-10 rounded-sm" />
        </span>{' '}
        system powered by real-time insights.
      </h1>

      <p className="text-muted text-[17px] md:text-[19px] leading-relaxed max-w-[560px] mx-auto mb-8">
        Dira tracks market trends, skill demands, and your personal progress to
        ensure you&apos;re always one step ahead in the graduate job market.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
        <Link
          to="/signup"
          className="bg-accent text-ink text-[15px] font-medium px-7 py-3 rounded-full hover:brightness-95 transition-all w-full sm:w-auto text-center"
        >
          Sign Up
        </Link>
        <a
          href="#features"
          className="bg-card-bg text-ink text-[15px] font-medium px-7 py-3 rounded-full border border-hairline hover:bg-secondary/50 transition-all w-full sm:w-auto text-center"
        >
          See features
        </a>
      </div>

      <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">
        Ready to start your career journey?
      </p>
    </section>
  )
}
