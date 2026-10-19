import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const CAREER_OPTIONS = [
  { id: 'early', label: 'Early career' },
  { id: 'experienced', label: 'Experienced' },
]

const ARRANGEMENT_OPTIONS = [
  { id: 'full_time', label: 'Full-time' },
  { id: 'part_time', label: 'Part-time' },
  { id: 'contract', label: 'Freelance / contract' },
]

function locationLabel(filters) {
  const loc = filters.location ?? ''
  if (!loc) return 'All locations'
  if (loc === 'remote') return 'Remote'
  return loc.length > 28 ? `${loc.slice(0, 26)}…` : loc
}

function multiLabel(prefix, selected, options) {
  if (!selected?.length) return `${prefix}: All`
  if (selected.length === 1) {
    const opt = options.find((o) => o.id === selected[0])
    return `${prefix}: ${opt?.label ?? selected[0]}`
  }
  return `${prefix}: ${selected.length} selected`
}

export default function JobFeedFilters({ filters, onChange, locationOptions = [] }) {
  const setField = (key, value) => onChange({ ...filters, [key]: value })

  const toggleList = (key, id) => {
    const list = filters[key] ?? []
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    setField(key, next)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs font-normal">
            Location: {locationLabel(filters)}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto w-56">
          <DropdownMenuLabel className="text-xs text-muted font-normal">Location</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setField('location', '')}>All locations</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setField('location', 'remote')}>Remote</DropdownMenuItem>
          {locationOptions.length > 0 && <DropdownMenuSeparator />}
          {locationOptions.map((loc) => (
            <DropdownMenuItem key={loc} onSelect={() => setField('location', loc)}>
              {loc}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs font-normal">
            {multiLabel('Job type', filters.careerStages, CAREER_OPTIONS)}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted font-normal">Job type</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setField('careerStages', [])}>All types</DropdownMenuItem>
          <DropdownMenuSeparator />
          {CAREER_OPTIONS.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.id}
              checked={(filters.careerStages ?? []).includes(opt.id)}
              onCheckedChange={() => toggleList('careerStages', opt.id)}
              onSelect={(e) => e.preventDefault()}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs font-normal">
            {multiLabel('Employment', filters.arrangements, ARRANGEMENT_OPTIONS)}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted font-normal">Employment</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setField('arrangements', [])}>All arrangements</DropdownMenuItem>
          <DropdownMenuSeparator />
          {ARRANGEMENT_OPTIONS.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.id}
              checked={(filters.arrangements ?? []).includes(opt.id)}
              onCheckedChange={() => toggleList('arrangements', opt.id)}
              onSelect={(e) => e.preventDefault()}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
