import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { diraApi } from '@/lib/api/dira'
import { useAuth } from '@/context/AuthProvider'
import { useStudentAppData } from '@/context/StudentAppDataProvider'
import { supabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/env'

export function useStudentProfile() {
  const { getAccessToken, refreshMe } = useAuth()
  const { profile: profileCache } = useStudentAppData()
  const [uploading, setUploading] = useState(false)

  const load = useCallback(
    async (force = false) => {
      await profileCache.load(force)
    },
    [profileCache]
  )

  useEffect(() => {
    load()
  }, [load])

  const me = profileCache.me
  const loading = profileCache.loading && !profileCache.me
  const error = profileCache.error

  const updateBio = useCallback(
    async (bio) => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      await diraApi.patchStudentProfile(token, { bio })
      await load(true)
      await refreshMe()
    },
    [getAccessToken, load, refreshMe]
  )

  const [savingCareer, setSavingCareer] = useState(false)

  const updateCareerDetails = useCallback(
    async (payload) => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      setSavingCareer(true)
      try {
        await diraApi.patchStudentProfile(token, payload)
        await load(true)
        await refreshMe()
      } finally {
        setSavingCareer(false)
      }
    },
    [getAccessToken, load, refreshMe]
  )

  const updateJazzicon = useCallback(
    async (jazziconSeed) => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      await diraApi.patchMe(token, {
        avatar_kind: 'jazzicon',
        jazzicon_seed: jazziconSeed,
        avatar_url: null,
      })
      await load(true)
      await refreshMe()
    },
    [getAccessToken, load, refreshMe]
  )

  const uploadAvatar = useCallback(
    async (file) => {
      if (!isSupabaseConfigured() || !supabase) {
        toast.error('Upload requires Supabase configuration.')
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be under 2MB.')
        return
      }
      setUploading(true)
      try {
        const token = await getAccessToken()
        if (!token) throw new Error('Not signed in')
        const { data: sessionData } = await supabase.auth.getSession()
        const userId = sessionData.session?.user?.id
        if (!userId) throw new Error('Not signed in')

        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
        const path = `${userId}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
          upsert: true,
          contentType: file.type,
        })
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        await diraApi.patchMe(token, {
          avatar_kind: 'upload',
          avatar_url: urlData.publicUrl,
        })
        await load(true)
        await refreshMe()
        toast.success('Photo updated')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [getAccessToken, load, refreshMe]
  )

  return {
    me,
    loading,
    error,
    uploading,
    refresh: load,
    updateBio,
    updateCareerDetails,
    savingCareer,
    updateJazzicon,
    uploadAvatar,
  }
}
