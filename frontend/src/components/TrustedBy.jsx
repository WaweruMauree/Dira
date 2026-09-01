const universities = ['Stanford', 'MIT', 'UC Berkeley', 'Harvard', 'Oxford']

export default function TrustedBy() {
  return (
    <section className="py-12 md:py-16 px-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted text-center mb-8">
        Trusted by students at
      </p>

      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-0">
        {universities.map((name, i) => (
          <div key={name} className="flex items-center">
            <span className="text-ink/25 font-heading text-lg md:text-xl font-medium select-none px-4 md:px-8">
              {name}
            </span>
            {i < universities.length - 1 && (
              <span className="hidden md:block w-px h-6 bg-hairline" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
