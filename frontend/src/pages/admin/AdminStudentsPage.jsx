import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminSession } from '@/hooks/useAdminSession'
import { diraApi } from '@/lib/api/dira'
import { useAdminPoll } from '@/hooks/useAdminPoll'

export default function AdminStudentsPage() {
  const { getAccessToken } = useAdminSession()
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminListStudents(token, { limit: 50, q: q || undefined })
    return res.data
  }, [getAccessToken, q])

  const { data, loading, error, refresh } = useAdminPoll(load, { intervalMs: 25_000 })

  const setStatus = async (userId, status) => {
    try {
      const token = await getAccessToken()
      if (!token) return
      await diraApi.adminPatchStudentStatus(token, userId, status)
      toast.success(status === 'SUSPENDED' ? 'Account suspended' : 'Account activated')
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-heading text-2xl font-medium text-ink">Student Management</h1>
      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Search by name, email, or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && refresh()}
        />
        <Button variant="outline" onClick={() => refresh()}>
          Search
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-xl border border-hairline overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-secondary/30 text-left text-xs text-muted">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">Course</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Onboarded</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data?.length ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : (data ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  No students found.
                </td>
              </tr>
            ) : (
              data.map((s) => (
                <tr key={s.userId} className="border-b border-hairline/60">
                  <td className="p-3 text-ink">{s.fullName || s.email || s.userId}</td>
                  <td className="p-3 text-muted">{s.phoneNumber || '-'}</td>
                  <td className="p-3 text-muted">{s.course || '-'}</td>
                  <td className="p-3">
                    <Badge variant={s.status === 'ACTIVE' ? 'accent' : 'outline'}>{s.status}</Badge>
                  </td>
                  <td className="p-3 text-muted">{s.onboarded ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    {s.status === 'SUSPENDED' ? (
                      <Button size="sm" variant="outline" onClick={() => setStatus(s.userId, 'ACTIVE')}>
                        Activate
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setStatus(s.userId, 'SUSPENDED')}>
                        Suspend
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
