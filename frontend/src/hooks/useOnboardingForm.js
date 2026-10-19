import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  DEFAULT_SKILL_LEVEL,
  normalizeSkillLevel,
} from '@/constants/skillLevels'
import {
  OTHER_COURSE_ID,
  getCourseDisplayLabel,
  getCourseSkillProfile,
  getProfileKey,
  resolveCourseForDatabase,
} from '@/constants/skills'
import { useAuth } from '@/context/AuthProvider'
import { useProgrammeSuggestions } from '@/hooks/useProgrammeSuggestions'

const initialState = {
  courseCatalogId: '',
  otherProgramme: '',
  yearOfStudy: '',
  technicalSkills: {},
  softSkills: {},
  careerInterests: [],
  customCareerInterests: [],
  careerReadiness: '',
  careerSearchFeedback: '',
}

const MAX_CAREER_SEARCH_FEEDBACK = 4000

function mergeUniqueInterests(preset, custom) {
  const seen = new Set()
  const out = []
  for (const item of [...preset, ...custom]) {
    const key = item.trim()
    if (!key) continue
    const lower = key.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    out.push(key)
  }
  return out
}

function applyPresetListChange(prev, oldPresetTech, oldPresetSoft, oldPresetInterests, newPresetTech, newPresetSoft, newPresetInterests) {
  const technicalSkills = Object.fromEntries(
    Object.entries(prev.technicalSkills).filter(
      ([skill]) => newPresetTech.includes(skill) || !oldPresetTech.includes(skill)
    )
  )
  const softSkills = Object.fromEntries(
    Object.entries(prev.softSkills).filter(
      ([skill]) => newPresetSoft.includes(skill) || !oldPresetSoft.includes(skill)
    )
  )
  const careerInterests = prev.careerInterests.filter(
    (i) => newPresetInterests.includes(i) || !oldPresetInterests.includes(i)
  )
  const customCareerInterests = prev.customCareerInterests.filter(
    (i) => !newPresetInterests.includes(i)
  )
  return { technicalSkills, softSkills, careerInterests, customCareerInterests }
}

export function useOnboardingForm() {
  const { getAccessToken, isConfigured } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  const profileKey = useMemo(() => getProfileKey(form), [form])
  const courseProfile = useMemo(() => getCourseSkillProfile(profileKey), [profileKey])
  const courseDisplayLabel = useMemo(() => getCourseDisplayLabel(form), [form])

  const programme = useProgrammeSuggestions({
    form,
    getAccessToken,
    isConfigured,
  })

  const technicalSkillOptions = programme.lists.technicalSkills
  const softSkillOptions = programme.lists.softSkills
  const interestOptions = programme.lists.careerInterests

  const presetSnapshotRef = useRef({
    signature: null,
    technical: [],
    soft: [],
    interests: [],
  })

  useEffect(() => {
    if (!programme.canFetch) return
    if (programme.suggestionsLoading && presetSnapshotRef.current.signature === null) return

    const prev = presetSnapshotRef.current
    if (prev.signature === programme.signature) return

    const oldTech = prev.technical.length ? prev.technical : technicalSkillOptions
    const oldSoft = prev.soft.length ? prev.soft : softSkillOptions
    const oldInterests = prev.interests.length ? prev.interests : interestOptions

    setForm((current) => ({
      ...current,
      ...applyPresetListChange(
        current,
        oldTech,
        oldSoft,
        oldInterests,
        technicalSkillOptions,
        softSkillOptions,
        interestOptions
      ),
    }))

    presetSnapshotRef.current = {
      signature: programme.signature,
      technical: technicalSkillOptions,
      soft: softSkillOptions,
      interests: interestOptions,
    }
  }, [
    programme.signature,
    programme.suggestionsLoading,
    programme.canFetch,
    technicalSkillOptions,
    softSkillOptions,
    interestOptions,
  ])

  const customTechnicalSkills = useMemo(() => {
    const names = Object.keys(form.technicalSkills).filter((s) => !technicalSkillOptions.includes(s))
    return names.sort((a, b) => a.localeCompare(b))
  }, [form.technicalSkills, technicalSkillOptions])

  const customSoftSkills = useMemo(() => {
    const names = Object.keys(form.softSkills).filter((s) => !softSkillOptions.includes(s))
    return names.sort((a, b) => a.localeCompare(b))
  }, [form.softSkills, softSkillOptions])

  const allTechnicalSkills = useMemo(
    () => [...technicalSkillOptions, ...customTechnicalSkills],
    [technicalSkillOptions, customTechnicalSkills]
  )

  const allSoftSkills = useMemo(
    () => [...softSkillOptions, ...customSoftSkills],
    [softSkillOptions, customSoftSkills]
  )

  const updateField = useCallback((field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }

      if (field === 'courseCatalogId' && value !== prev.courseCatalogId) {
        next.otherProgramme = value === OTHER_COURSE_ID ? prev.otherProgramme : ''
        presetSnapshotRef.current = { signature: null, technical: [], soft: [], interests: [] }
      }

      if (field === 'otherProgramme' && value !== prev.otherProgramme) {
        presetSnapshotRef.current = { signature: null, technical: [], soft: [], interests: [] }
      }

      return next
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const addCustomSkill = useCallback((category, name) => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) return false
    const key = category === 'technical' ? 'technicalSkills' : 'softSkills'
    setForm((prev) => {
      const map = { ...prev[key] }
      const exists = Object.keys(map).some((k) => k.toLowerCase() === trimmed.toLowerCase())
      if (exists) return prev
      map[trimmed] = DEFAULT_SKILL_LEVEL
      return { ...prev, [key]: map }
    })
    return true
  }, [])

  const toggleSkill = useCallback((category, skill, level = DEFAULT_SKILL_LEVEL) => {
    setForm((prev) => {
      const key = category === 'technical' ? 'technicalSkills' : 'softSkills'
      const current = { ...prev[key] }
      if (current[skill] !== undefined) {
        delete current[skill]
      } else {
        current[skill] = level
      }
      return { ...prev, [key]: current }
    })
  }, [])

  const setSkillLevel = useCallback((category, skill, level) => {
    const normalized = normalizeSkillLevel(level)
    setForm((prev) => {
      const key = category === 'technical' ? 'technicalSkills' : 'softSkills'
      return { ...prev, [key]: { ...prev[key], [skill]: normalized } }
    })
  }, [])

  const toggleInterest = useCallback((interest) => {
    setForm((prev) => {
      const exists = prev.careerInterests.includes(interest)
      return {
        ...prev,
        careerInterests: exists
          ? prev.careerInterests.filter((i) => i !== interest)
          : [...prev.careerInterests, interest],
      }
    })
  }, [])

  const addCustomInterest = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) return false
    setForm((prev) => {
      const combined = mergeUniqueInterests(prev.careerInterests, [trimmed])
      const presetLower = new Set(interestOptions.map((i) => i.toLowerCase()))
      const customCareerInterests = combined.filter((i) => !presetLower.has(i.toLowerCase()))
      return { ...prev, careerInterests: combined, customCareerInterests }
    })
    return true
  }, [interestOptions])

  const validateStep = useCallback(
    (currentStep) => {
      const nextErrors = {}
      if (currentStep === 1) {
        if (!form.courseCatalogId) nextErrors.courseCatalogId = 'Course is required'
        if (form.courseCatalogId === OTHER_COURSE_ID && !form.otherProgramme?.trim()) {
          nextErrors.otherProgramme = 'Please specify your programme'
        }
        if (form.courseCatalogId === OTHER_COURSE_ID && form.otherProgramme?.trim().length < 2) {
          nextErrors.otherProgramme = 'Programme name must be at least 2 characters'
        }
        if (!form.yearOfStudy) nextErrors.yearOfStudy = 'Year of study is required'
      }
      if (currentStep === 2) {
        if (!form.courseCatalogId) {
          nextErrors.courseCatalogId = 'Go back and select your course first'
        }
        if (Object.keys(form.technicalSkills).length === 0) {
          nextErrors.technicalSkills = 'Select at least one technical skill for your programme'
        }
        if (Object.keys(form.softSkills).length === 0) {
          nextErrors.softSkills = 'Select at least one soft skill for your programme'
        }
      }
      if (currentStep === 3) {
        const interests = mergeUniqueInterests(form.careerInterests, [])
        if (interests.length === 0) {
          nextErrors.careerInterests = 'Select at least one career interest'
        }
        if (!form.careerReadiness) nextErrors.careerReadiness = 'Select your readiness level'
      }
      if (currentStep === 4) {
        const len = form.careerSearchFeedback?.trim().length ?? 0
        if (len > MAX_CAREER_SEARCH_FEEDBACK) {
          nextErrors.careerSearchFeedback = `Keep your answer under ${MAX_CAREER_SEARCH_FEEDBACK} characters`
        }
      }
      setErrors(nextErrors)
      return Object.keys(nextErrors).length === 0
    },
    [form]
  )

  const next = useCallback(() => {
    if (step === 2 && programme.suggestionsLoading) return
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4))
  }, [step, validateStep, programme.suggestionsLoading])

  const back = useCallback(() => setStep((s) => Math.max(s - 1, 1)), [])

  const submit = useCallback(() => {
    if (!validateStep(4)) return null
    const course = resolveCourseForDatabase(form)
    if (!course) return null

    const feedback = form.careerSearchFeedback?.trim()
    return {
      course,
      courseCatalogId: form.courseCatalogId,
      otherProgramme: form.courseCatalogId === OTHER_COURSE_ID ? form.otherProgramme.trim() : undefined,
      yearOfStudy: Number(form.yearOfStudy),
      technicalSkills: form.technicalSkills,
      softSkills: form.softSkills,
      careerInterests: mergeUniqueInterests(form.careerInterests, []),
      careerReadiness: form.careerReadiness,
      ...(feedback ? { careerSearchFeedback: feedback } : {}),
    }
  }, [form, validateStep])

  return {
    step,
    form,
    errors,
    updateField,
    addCustomSkill,
    toggleSkill,
    setSkillLevel,
    toggleInterest,
    addCustomInterest,
    next,
    back,
    submit,
    totalSteps: 4,
    courseProfile,
    courseDisplayLabel,
    profileKey,
    technicalSkillOptions,
    softSkillOptions,
    allTechnicalSkills,
    allSoftSkills,
    interestOptions,
    suggestionsLoading: programme.suggestionsLoading,
    suggestionsFetchError: programme.fetchError,
    suggestionsSource: programme.source,
  }
}
