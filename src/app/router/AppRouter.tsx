import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminPayoutsPage } from '../../features/admin/pages/AdminPayoutsPage'
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage'
import { HomePage } from '../../features/auth/pages/HomePage'
import { CheckInboxPage } from '../../features/auth/pages/CheckInboxPage'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { RegisterPage } from '../../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage'
import { CreateCreatorPage } from '../../features/creators/pages/CreateCreatorPage'
import { CreatorPayoutsPage } from '../../features/creators/pages/CreatorPayoutsPage'
import { CreatorSettingsPage } from '../../features/creators/pages/CreatorSettingsPage'
import { CreatorWorkspacePage } from '../../features/creators/pages/CreatorWorkspacePage'
import { PaymentStatusPage } from '../../features/creators/pages/PaymentStatusPage'
import { LandingPageAnalyticsPage } from '../../features/landing-pages/pages/LandingPageAnalyticsPage'
import { LandingPageEditorPage } from '../../features/landing-pages/pages/LandingPageEditorPage'
import { LandingPagesPage } from '../../features/landing-pages/pages/LandingPagesPage'
import { OrderSuccessPage } from '../../features/landing-pages/pages/OrderSuccessPage'
import { PublicLandingPage } from '../../features/landing-pages/pages/PublicLandingPage'
import { EmailsPage } from '../../features/marketing/pages/EmailsPage'
import { SubscribersPage } from '../../features/marketing/pages/SubscribersPage'
import { ProductsPage } from '../../features/products/pages/ProductsPage'
import { OrdersPage } from '../../features/orders/pages/OrdersPage'
import { AdminRoute } from './AdminRoute'
import { AuthBootstrap } from './AuthBootstrap'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

// Development-only component catalogue; the dynamic import is dropped from production builds.
const StyleguidePage = import.meta.env.DEV ? lazy(() => import('../../dev/styleguide/StyleguidePage')) : null

export function AppRouter() {
  return (
    <Routes>
      {StyleguidePage && (
        <Route
          path="/__styleguide"
          element={
            <Suspense fallback={null}>
              <StyleguidePage />
            </Suspense>
          }
        />
      )}
      <Route element={<AuthBootstrap />}>
        <Route path="/p/:creatorSlug/:pageSlug/success" element={<OrderSuccessPage />} />
        <Route path="/p/:creatorSlug/:pageSlug" element={<PublicLandingPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/check-inbox" element={<CheckInboxPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/payment/success" element={<PaymentStatusPage status="success" />} />
        <Route path="/payment/cancel" element={<PaymentStatusPage status="cancel" />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/app/:slug" element={<CreatorWorkspacePage />} />
          <Route path="/app/:slug/products" element={<ProductsPage />} />
          <Route path="/app/:slug/orders" element={<OrdersPage />} />
          <Route path="/app/:slug/landing-pages" element={<LandingPagesPage />} />
          <Route path="/app/:slug/landing-pages/:pageId" element={<LandingPageAnalyticsPage />} />
          <Route path="/app/:slug/landing-pages/:pageId/edit" element={<LandingPageEditorPage />} />
          <Route path="/app/:slug/emails" element={<EmailsPage />} />
          <Route path="/app/:slug/subscribers" element={<SubscribersPage />} />
          <Route path="/app/:slug/payouts" element={<CreatorPayoutsPage />} />
          <Route path="/app/:slug/settings" element={<CreatorSettingsPage />} />
          <Route path="/creators/new" element={<CreateCreatorPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
