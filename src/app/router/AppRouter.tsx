import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '../../features/auth/pages/HomePage'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { RegisterPage } from '../../features/auth/pages/RegisterPage'
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage'
import { CreateCreatorPage } from '../../features/creators/pages/CreateCreatorPage'
import { CreatorSettingsPage } from '../../features/creators/pages/CreatorSettingsPage'
import { CreatorWorkspacePage } from '../../features/creators/pages/CreatorWorkspacePage'
import { AuthBootstrap } from './AuthBootstrap'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthBootstrap />}>
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/app/:slug" element={<CreatorWorkspacePage />} />
          <Route path="/app/:slug/settings" element={<CreatorSettingsPage />} />
          <Route path="/creators/new" element={<CreateCreatorPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
