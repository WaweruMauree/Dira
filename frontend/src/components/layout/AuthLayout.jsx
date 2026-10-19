import { Outlet } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'
import DiraLogo from '@/components/DiraLogo'
import { Link } from 'react-router-dom'
import { AuthFormNoticeProvider, useAuthFormNotice } from '@/context/AuthFormNoticeContext'
import AuthInlineNotice from '@/components/auth/AuthInlineNotice'
import RouterAuthFlashBar from '@/components/auth/RouterAuthFlashBar'

function AuthLayoutContent() {
  const { formNotice } = useAuthFormNotice()

  return (
    <div className="min-h-screen bg-ground flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-ink">
          <DiraLogo size={24} />
          <span className="font-medium">Dira</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex flex-col min-h-0 px-4">
        <div className="w-full shrink-0 space-y-3 flex flex-col items-center">
          <RouterAuthFlashBar className="px-0 pb-0 pt-0" />
          {formNotice ? (
            <AuthInlineNotice
              variant={formNotice.variant}
              message={formNotice.message}
              detail={formNotice.detail}
            />
          ) : null}
        </div>
        <div className="flex-1 flex items-center justify-center pb-8 pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default function AuthLayout() {
  return (
    <AuthFormNoticeProvider>
      <AuthLayoutContent />
    </AuthFormNoticeProvider>
  )
}
