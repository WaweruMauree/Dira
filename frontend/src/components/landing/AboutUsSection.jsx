export default function AboutUsSection() {
  return (
    <section id="about-us" className="max-w-[820px] mx-auto px-4 py-16 border-t border-hairline/60">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-4">
        About us
      </p>
      <h2 className="font-heading text-3xl md:text-4xl font-medium text-ink mb-6 tracking-tight">
        Built for Strathmore students, by a Strathmore student
      </h2>
      <div className="bg-card-bg rounded-xl border border-hairline/50 shadow-card p-6 md:p-8 space-y-4">
        <p className="text-muted text-[16px] leading-relaxed">
          Dira is a research project developed at Strathmore University to address the graduate
          employment challenge facing Kenyan university students — particularly those without
          established professional networks.
        </p>
        <p className="text-muted text-[16px] leading-relaxed">
          Our mission is to democratise access to career intelligence: giving every undergraduate
          across Strathmore&apos;s seven schools the same quality of guidance that well-connected
          students receive through alumni and informal networks.
        </p>
        <div className="pt-2 border-t border-hairline/40">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Research project</p>
          <p className="text-ink text-sm mt-1">Strathmore University · BBIT · 2026</p>
        </div>
      </div>
    </section>
  )
}
