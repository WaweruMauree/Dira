import { useState, useCallback, useMemo } from 'react'
import {
  CAREER_INTERESTS,
  filterSkillsForCourse,
  getCourseSkillProfile,
  getSoftSkillsForCourse,
  getTechnicalSkillsForCourse,
} from '@/constants/skills'

const initialState = {
  course: '',
  yearOfStudy: '',
  technicalSkills: {},
  softSkills: {},
  careerInterests: [],
  careerReadiness: '',
}

export function useOnboardingForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  const courseProfile = useMemo(
    () => getCourseSkillProfile(form.course),
    [form.course]
  )

  const technicalSkillOptions = useMemo(
    () => getTechnicalSkillsForCourse(form.course),
    [form.course]
  )

  const softSkillOptions = useMemo(
    () => getSoftSkillsForCourse(form.course),
    [form.course]
  )

  const updateField = useCallback((field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }

      if (field === 'course' && value !== prev.course) {
        const technical = getTechnicalSkillsForCourse(value)
        const soft = getSoftSkillsForCourse(value)
        next.technicalSkills = filterSkillsForCourse(prev.technicalSkills, technical)
        next.softSkills = filterSkillsForCourse(prev.softSkills, soft)
      }

      return next
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const toggleSkill = useCallback((category, skill, level = 3) => {
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
    setForm((prev) => {
      const key = category === 'technical' ? 'technicalSkills' : 'softSkills'
      return { ...prev, [key]: { ...prev[key], [skill]: level } }
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

  const validateStep = useCallback(
    (currentStep) => {
      const nextErrors = {}
      if (currentStep === 1) {
        if (!form.course) nextErrors.course = 'Course is required'
        if (!form.yearOfStudy) nextErrors.yearOfStudy = 'Year of study is required'
      }
      if (currentStep === 2) {
        if (!form.course) {
          nextErrors.course = 'Go back and select your course first'
        }
        if (Object.keys(form.technicalSkills).length === 0) {
          nextErrors.technicalSkills = 'Select at least one technical skill for your programme'
        }
        if (Object.keys(form.softSkills).length === 0) {
          nextErrors.softSkills = 'Select at least one soft skill for your programme'
        }
      }
      if (currentStep === 3) {
        if (form.careerInterests.length === 0) {
          nextErrors.careerInterests = 'Select at least one career interest'
        }
        if (!form.careerReadiness) nextErrors.careerReadiness = 'Select your readiness level'
      }
      setErrors(nextErrors)
      return Object.keys(nextErrors).length === 0
    },
    [form]
  )

  const next = useCallback(() => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3))
  }, [step, validateStep])

  const back = useCallback(() => setStep((s) => Math.max(s - 1, 1)), [])

  const submit = useCallback(() => {
    if (!validateStep(3)) return null
    return {
      course: form.course,
      yearOfStudy: Number(form.yearOfStudy),
      technicalSkills: form.technicalSkills,
      softSkills: form.softSkills,
      careerInterests: form.careerInterests,
      careerReadiness: form.careerReadiness,
    }
  }, [form, validateStep])

  return {
    step,
    form,
    errors,
    updateField,
    toggleSkill,
    setSkillLevel,
    toggleInterest,
    next,
    back,
    submit,
    totalSteps: 3,
    courseProfile,
    technicalSkillOptions,
    softSkillOptions,
    interestOptions: CAREER_INTERESTS,
  }
}
