import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import OnboardingProgress from '@/components/onboarding/OnboardingProgress'
import OnboardingStep1 from '@/components/onboarding/OnboardingStep1'
import OnboardingStep2 from '@/components/onboarding/OnboardingStep2'
import OnboardingStep3 from '@/components/onboarding/OnboardingStep3'
import OnboardingStep4 from '@/components/onboarding/OnboardingStep4'
import { useOnboardingForm } from '@/hooks/useOnboardingForm'
import { setOnboardingComplete } from '@/lib/storage'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'
import { AgentApiError } from '@/lib/api/client'
import { isSupabaseConfigured } from '@/lib/env'
import { useState } from 'react'
import { useSkillProficiencyRubrics } from '@/hooks/useSkillProficiencyRubrics'
import RouterAuthFlashBar from '@/components/auth/RouterAuthFlashBar'
import AuthInlineNotice from '@/components/auth/AuthInlineNotice'
import {
  AUTH_FLASH_ONBOARDING_COMPLETE,
  AUTH_FLASH_PROFILE_MISSING,
  AUTH_FLASH_SESSION_EXPIRED,
  authFlashNavigationState,
  buildAuthFlash,
} from '@/lib/auth/authFlash'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { getAccessToken, refreshMe, applyOnboardingComplete, isConfigured, signOut } = useAuth()
  const [saving, setSaving] = useState(false)
  const [finishNotice, setFinishNotice] = useState(null)
  const {
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
    totalSteps,
    courseDisplayLabel,
    allTechnicalSkills,
    allSoftSkills,
    technicalSkillOptions,
    softSkillOptions,
    interestOptions,
    suggestionsLoading,
    suggestionsFetchError,
  } = useOnboardingForm()

  const {
    rubricsBySkill,
    enabled: rubricsEnabled,
    fetchRubricForSkill,
    mergeRubric,
  } = useSkillProficiencyRubrics({
    courseCatalogId: form.courseCatalogId || 'OTHER',
    courseLabel: courseDisplayLabel,
    technicalSkills: allTechnicalSkills,
    softSkills: allSoftSkills,
    presetTechnicalSkills: technicalSkillOptions,
    presetSoftSkills: softSkillOptions,
  })

  const handleFinish = async () => {
    const data = submit()
    if (!data) return
    setFinishNotice(null)
    setSaving(true)
    try {
      const token = await getAccessToken()
      const shouldCallApi = isSupabaseConfigured() && isConfigured

      if (shouldCallApi) {
        if (!token) {
          const flash = buildAuthFlash('error', AUTH_FLASH_SESSION_EXPIRED)
          navigate('/login', { state: authFlashNavigationState(flash) })
          return
        }
        const { data: saved } = await diraApi.onboarding(token, data)
        applyOnboardingComplete(saved)
        void refreshMe()
      }

      setOnboardingComplete(data)
      const flash = buildAuthFlash('success', AUTH_FLASH_ONBOARDING_COMPLETE)
      navigate('/home', { state: authFlashNavigationState(flash) })
    } catch (err) {
      let message =
        err instanceof AgentApiError
          ? err.message
          : err?.message || 'Failed to save onboarding'
      if (err instanceof AgentApiError && err.status === 403 && /^forbidden$/i.test(message.trim())) {
        message =
          'Could not save your profile (permission denied). Ensure the backend has SUPABASE_SERVICE_ROLE_KEY set.'
      }
      if (/profile not found/i.test(message)) {
        setFinishNotice({ variant: 'error', message: AUTH_FLASH_PROFILE_MISSING })
        await signOut()
        const flash = buildAuthFlash('error', AUTH_FLASH_PROFILE_MISSING)
        navigate('/login', { state: authFlashNavigationState(flash) })
        return
      }
      setFinishNotice({ variant: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-ground flex flex-col">
      <RouterAuthFlashBar />
      <div className="flex-1 max-w-6xl mx-auto p-6 md:p-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-card-bg border border-hairline rounded-xl shadow-card p-6 md:p-8 min-h-[480px]">
              {step === 1 && (
                <OnboardingStep1 form={form} errors={errors} updateField={updateField} />
              )}
              {step === 2 && (
                <OnboardingStep2
                  form={form}
                  errors={errors}
                  courseDisplayLabel={courseDisplayLabel}
                  allTechnicalSkills={allTechnicalSkills}
                  allSoftSkills={allSoftSkills}
                  addCustomSkill={addCustomSkill}
                  toggleSkill={toggleSkill}
                  setSkillLevel={setSkillLevel}
                  rubricsBySkill={rubricsBySkill}
                  rubricsEnabled={rubricsEnabled}
                  fetchRubricForSkill={fetchRubricForSkill}
                  mergeRubric={mergeRubric}
                  suggestionsLoading={suggestionsLoading}
                  suggestionsFetchError={suggestionsFetchError}
                />
              )}
              {step === 3 && (
                <OnboardingStep3
                  form={form}
                  errors={errors}
                  interestOptions={interestOptions}
                  courseDisplayLabel={courseDisplayLabel}
                  toggleInterest={toggleInterest}
                  addCustomInterest={addCustomInterest}
                  updateField={updateField}
                  suggestionsLoading={suggestionsLoading}
                  suggestionsFetchError={suggestionsFetchError}
                />
              )}
              {step === 4 && (
                <OnboardingStep4 form={form} errors={errors} updateField={updateField} />
              )}

              <div className="flex justify-between mt-10 pt-6 border-t border-hairline">
                <Button variant="outline" onClick={back} disabled={step === 1}>
                  Back
                </Button>
                {step < totalSteps ? (
                  <Button
                    variant="accent"
                    onClick={next}
                    disabled={step === 2 && suggestionsLoading}
                  >
                    {step === 2 && suggestionsLoading ? 'Loading skills…' : 'Continue'}
                  </Button>
                ) : (
                  <Button variant="accent" onClick={handleFinish} disabled={saving}>
                    {saving ? 'Saving...' : 'Complete setup'}
                  </Button>
                )}
              </div>
            </div>
            {finishNotice ? (
              <div className="mt-4">
                <AuthInlineNotice
                  variant={finishNotice.variant}
                  message={finishNotice.message}
                  detail={finishNotice.detail}
                />
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-1 order-first lg:order-last">
            <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
          </div>
        </div>
      </div>
    </div>
  )
}
