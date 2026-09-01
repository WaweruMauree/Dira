/**
 * Human-readable formatters for agent tool inputs and outputs.
 * Used by ToolCallBlock — avoids showing raw JSON to users.
 */

function asLines(items) {
  return items.filter(Boolean)
}

function formatLinkedInJobSearch(input, output) {
  const lines = []
  if (input?.query) lines.push(`Searching for "${input.query}"${input.location ? ` in ${input.location}` : ''}`)
  if (output?.source) lines.push(`Source: ${output.source}`)
  if (Array.isArray(output?.results)) {
    output.results.forEach((job, i) => {
      lines.push(
        `${i + 1}. ${job.title} at ${job.company}${job.location ? ` · ${job.location}` : ''}${job.match != null ? ` · ${job.match}% match` : ''}`
      )
    })
  }
  return asLines(lines)
}

function formatWebSearch(input, output) {
  const lines = []
  if (input?.query) lines.push(`Query: "${input.query}"`)
  if (output?.error) lines.push(`Search unavailable: ${output.error}`)
  if (Array.isArray(output?.results)) {
    output.results.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.title}${item.url ? ` — ${item.url}` : ''}`)
      if (item.snippet) lines.push(item.snippet)
    })
  }
  if (Array.isArray(output?.snippets)) {
    output.snippets.forEach((snippet, i) => lines.push(`${i + 1}. ${snippet}`))
  }
  if (output?.summary && typeof output.summary === 'string') {
    lines.push(output.summary)
  }
  return asLines(lines)
}

function formatSaveOpportunity(input, output) {
  const lines = []
  if (input?.title) lines.push(`Saving: ${input.title}`)
  if (output?.saved) lines.push('Opportunity saved to your list.')
  if (output?.message) lines.push(output.message)
  return asLines(lines)
}

function formatMapPathway(input, output) {
  const lines = []
  if (input?.targetRole) lines.push(`Target role: ${input.targetRole}`)
  if (output?.estimatedMonths != null) {
    lines.push(`Estimated timeline: ${output.estimatedMonths} months`)
  }
  if (Array.isArray(output?.roles)) {
    output.roles.slice(0, 6).forEach((role, i) => {
      lines.push(`${i + 1}. ${role.title || role.name || 'Role'}`)
    })
  }
  if (Array.isArray(output?.steps)) {
    lines.push('Pathway steps:')
    output.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`))
  }
  return asLines(lines)
}

function formatAnalyzeSkillsGap(input, output) {
  const lines = []
  if (input?.targetRole) lines.push(`Comparing against: ${input.targetRole}`)
  if (Array.isArray(output?.strengths) && output.strengths.length) {
    lines.push(`Strengths: ${output.strengths.join(', ')}`)
  }
  if (Array.isArray(output?.gaps) && output.gaps.length) {
    lines.push('Gaps to close:')
    output.gaps.forEach((gap, i) => lines.push(`${i + 1}. ${gap}`))
  }
  return asLines(lines)
}

function formatListJobs(input, output) {
  const lines = []
  if (input?.query) lines.push(`Searching for "${input.query}"`)
  if (output?.count != null) lines.push(`${output.count} listings stored`)
  if (Array.isArray(output?.jobs)) {
    output.jobs.slice(0, 5).forEach((job, i) => {
      lines.push(`${i + 1}. ${job.title}${job.organisation ? ` at ${job.organisation}` : ''}`)
    })
  }
  return asLines(lines)
}

function formatBuildCv(_input, output) {
  const lines = []
  if (output?.resume?.basics?.name) lines.push(`Name: ${output.resume.basics.name}`)
  if (output?.resume?.basics?.label) lines.push(`Headline: ${output.resume.basics.label}`)
  if (output?.saved) lines.push('CV saved to your profile.')
  return asLines(lines)
}

function formatSalary(input, output) {
  const lines = []
  if (input?.query) lines.push(`Role: ${input.query}`)
  if (output?.min != null) lines.push(`Min: ${output.min}`)
  if (output?.median != null) lines.push(`Median: ${output.median}`)
  if (output?.max != null) lines.push(`Max: ${output.max}`)
  if (output?.currency) lines.push(`Currency: ${output.currency}`)
  if (output?.sampleSize != null) lines.push(`Sample: ${output.sampleSize} listings`)
  return asLines(lines)
}

function formatProfileLookup(_input, output) {
  const lines = []
  if (output?.course) lines.push(`Course: ${output.course}`)
  if (output?.year != null) lines.push(`Year of study: ${output.year}`)
  if (output?.readiness) lines.push(`Readiness: ${output.readiness}`)
  if (output?.headline) lines.push(output.headline)
  return asLines(lines)
}

const FORMATTERS = {
  linkedinJobSearch: formatLinkedInJobSearch,
  listJobs: formatListJobs,
  webSearch: formatWebSearch,
  saveOpportunity: formatSaveOpportunity,
  mapPathway: formatMapPathway,
  analyzeSkillsGap: formatAnalyzeSkillsGap,
  profileLookup: formatProfileLookup,
  buildCv: formatBuildCv,
  salaryEstimator: formatSalary,
}

function flattenObject(obj, prefix = '') {
  const lines = []
  if (!obj || typeof obj !== 'object') return lines
  for (const [key, value] of Object.entries(obj)) {
    const label = prefix ? `${prefix}.${key}` : key
    if (value == null) continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${label}: ${value}`)
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'string') lines.push(`${i + 1}. ${item}`)
        else if (item && typeof item === 'object' && item.title) {
          lines.push(`${i + 1}. ${item.title}${item.company ? ` at ${item.company}` : ''}`)
        }
      })
    }
  }
  return lines
}

export function formatToolInput(name, input) {
  if (!input || Object.keys(input).length === 0) return []
  const formatter = FORMATTERS[name]
  if (formatter) {
    const lines = formatter(input, null)
    return lines.filter((line) => !line.startsWith('Source:') && !/^\d+\./.test(line))
  }
  return flattenObject(input)
}

export function formatToolOutput(name, output, input) {
  if (output == null) return []
  if (typeof output === 'string') return [output]

  const formatter = FORMATTERS[name]
  if (formatter) {
    return formatter(input, output)
  }

  const lines = flattenObject(output)
  return lines.length ? lines : ['Completed successfully.']
}

export function getToolStatusLabel(status) {
  switch (status) {
    case 'complete':
      return 'Complete'
    case 'error':
      return 'Failed'
    case 'pending':
    default:
      return 'Running'
  }
}
