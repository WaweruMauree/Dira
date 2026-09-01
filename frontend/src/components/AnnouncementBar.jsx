export default function AnnouncementBar() {
  return (
    <div className="bg-announcement w-full py-2.5 px-4">
      <p className="text-center text-white text-xs font-mono tracking-wide">
        Series A closed. Read the note{' '}
        <span className="inline-block ml-0.5 transition-transform hover:translate-x-0.5">→</span>
      </p>
    </div>
  )
}
