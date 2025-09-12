export default function SectionHeader({title, subtitle}:{title:string; subtitle?:string}) {
  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-accent"></span> EXP Event
      </div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
    </div>
  )
}
