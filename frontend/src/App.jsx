import { Navigate, Routes, Route } from 'react-router-dom'
import LandingLayout from '@/components/layout/LandingLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import AppLayout from '@/components/layout/AppLayout'
import { ProtectedRoute, OnboardingGate, PublicOnlyRoute, AdminRoute } from '@/components/layout/RouteGuards'
import AdminLayout from '@/components/layout/AdminLayout'
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage'
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage'
import AdminModerationPage from '@/pages/admin/AdminModerationPage'
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage'
import AdminUsageReportsPage from '@/pages/admin/AdminUsageReportsPage'
import AdminSystemPage from '@/pages/admin/AdminSystemPage'
import ErrorBoundary from '@/components/ErrorBoundary'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import OnboardingPage from '@/pages/OnboardingPage'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import SkillsAnalysisPage from '@/pages/SkillsAnalysisPage'
import CareerPathwayPage from '@/pages/CareerPathwayPage'
import JobSearchPage from '@/pages/JobSearchPage'
import ProfilePage from '@/pages/ProfilePage'
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
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="students" element={<AdminStudentsPage />} />
              <Route path="moderation" element={<AdminModerationPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="usage-reports" element={<AdminUsageReportsPage />} />
              <Route path="system" element={<AdminSystemPage />} />
            </Route>
          </Route>

          <Route path="onboarding" element={<OnboardingGate requireComplete={false} />}>
            <Route index element={<OnboardingPage />} />
          </Route>

          <Route element={<OnboardingGate requireComplete />}>
            <Route element={<AppLayout />}>
              <Route path="home" element={<HomePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="chat/new" element={<NewChatRedirect mode="general" />} />
              <Route path="chat/:chatId" element={<ChatPage />} />
              <Route path="skills-analysis" element={<SkillsAnalysisPage />} />
              <Route path="career-pathway" element={<CareerPathwayPage />} />
              <Route path="skills-analysis/new" element={<Navigate to="/skills-analysis" replace />} />
              <Route path="career-guidance/new" element={<Navigate to="/skills-analysis" replace />} />
              <Route path="career-guidance/:chatId" element={<Navigate to="/skills-analysis" replace />} />
              <Route path="jobs" element={<JobSearchPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
