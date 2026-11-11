import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/context/ThemeProvider'
import { AuthProvider } from '@/context/AuthProvider'
import { AdminAuthProvider } from '@/context/AdminAuthProvider'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { checkEnv } from '@/lib/env'
import { applyTheme, getStoredTheme } from '@/lib/theme'
import './index.css'
import App from './App.jsx'

applyTheme(getStoredTheme())
checkEnv()

function AuthShell({ children }) {
  if (import.meta.env.DEV && supabaseAdmin) {
    return <AdminAuthProvider client={supabaseAdmin}>{children}</AdminAuthProvider>
  }
  return children
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider client={supabase}>
          <AuthShell>
            <App />
            <Toaster position="top-center" richColors />
          </AuthShell>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
