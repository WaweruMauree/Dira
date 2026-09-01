import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import OnboardingProgress from '@/components/onboarding/OnboardingProgress'
import OnboardingStep1 from '@/components/onboarding/OnboardingStep1'
import OnboardingStep2 from '@/components/onboarding/OnboardingStep2'
import OnboardingStep3 from '@/components/onboarding/OnboardingStep3'
import { useOnboardingForm } from '@/hooks/useOnboardingForm'
import { setOnboardingComplete } from '@/lib/storage'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'
import { useState } from 'react'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { getAccessToken, refreshMe } = useAuth()
  const [saving, setSaving] = useState(false)
  const {
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
    totalSteps,
    courseProfile,
    technicalSkillOptions,
    softSkillOptions,
    interestOptions,
  } = useOnboardingForm()

  const handleFinish = async () => {
    const data = submit()
    if (!data) return
    setSaving(true)
    try {
      const token = await getAccessToken()
      if (token) {
        await diraApi.onboarding(token, data)
        await refreshMe()
      }
      setOnboardingComplete(data)
      navigate('/home')
    } catch (err) {
      toast.error(err.message || 'Failed to save onboarding')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
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
                courseProfile={courseProfile}
                technicalSkillOptions={technicalSkillOptions}
                softSkillOptions={softSkillOptions}
                toggleSkill={toggleSkill}
                setSkillLevel={setSkillLevel}
              />
            )}
            {step === 3 && (
              <OnboardingStep3
                form={form}
                errors={errors}
                interestOptions={interestOptions}
                toggleInterest={toggleInterest}
                updateField={updateField}
              />
            )}

            <div className="flex justify-between mt-10 pt-6 border-t border-hairline">
              <Button variant="outline" onClick={back} disabled={step === 1}>
                Back
              </Button>
              {step < totalSteps ? (
                <Button variant="accent" onClick={next}>Continue</Button>
              ) : (
                <Button variant="accent" onClick={handleFinish} disabled={saving}>
                  {saving ? 'Saving...' : 'Complete setup'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 order-first lg:order-last">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
        </div>
      </div>
    </div>
  )
}
