import { Routes, Route } from 'react-router-dom'
import LandingLayout from '@/components/layout/LandingLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import AppLayout from '@/components/layout/AppLayout'
import { ProtectedRoute, OnboardingGate, PublicOnlyRoute } from '@/components/layout/RouteGuards'
import ErrorBoundary from '@/components/ErrorBoundary'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import OnboardingPage from '@/pages/OnboardingPage'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import CareerGuidancePage from '@/pages/CareerGuidancePage'
import JobAggregationPage from '@/pages/JobAggregationPage'
import NewChatRedirect from '@/pages/NewChatRedirect'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route index element={<LandingPage />} />
        </Route>

        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="onboarding" element={<OnboardingGate requireComplete={false} />}>
            <Route index element={<OnboardingPage />} />
          </Route>

          <Route element={<OnboardingGate requireComplete />}>
            <Route element={<AppLayout />}>
              <Route path="home" element={<HomePage />} />
              <Route path="chat/new" element={<NewChatRedirect mode="general" />} />
              <Route path="chat/:chatId" element={<ChatPage />} />
              <Route path="career-guidance/new" element={<NewChatRedirect mode="career_guidance" />} />
              <Route path="career-guidance/:chatId" element={<CareerGuidancePage />} />
              <Route path="jobs/new" element={<NewChatRedirect mode="job_aggregation" />} />
              <Route path="jobs/:chatId" element={<JobAggregationPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
