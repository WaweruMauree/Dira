const PHASE_LABEL = {
  thinking: 'Thinking...',
  cogitating: 'Cogitating...',
  finalising: 'Finalising response...',
}

export default function ChatAgentStatus({ phase }) {
  if (!phase || !PHASE_LABEL[phase]) return null

  return (
    <div className="flex justify-start -mt-1">
      <p className="text-sm text-muted pl-1">{PHASE_LABEL[phase]}</p>
    </div>
  )
}
