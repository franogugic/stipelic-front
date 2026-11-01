import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui/ledger'
import { AuthSplitLayout } from './AuthSplitLayout'

/** The register route while registration is closed (`openRegistration` false): no form, a way to log in. */
export function PrivateBetaNotice() {
  return (
    <AuthSplitLayout>
      <div className="stack stack--sm">
        <h1 className="page-title">
          Luma is in <em>private beta</em>
        </h1>
        <p className="text-secondary">
          We are inviting creators one by one. If you have an invite, open the email we sent you and set your password from
          the link in it.
        </p>
      </div>
      <Button variant="primary" size="lg" block to="/login">
        Log in
      </Button>
      <p className="text-sm text-secondary">
        Forgot your password? <Link className="link" to="/forgot-password">Reset it</Link>
      </p>
    </AuthSplitLayout>
  )
}
