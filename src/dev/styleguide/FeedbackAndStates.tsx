import {
  AppWindow,
  Archive,
  CalendarClock,
  ChartColumn,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CreditCard,
  Info,
  Landmark,
  Link,
  PanelsTopLeft,
  Package,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { useRef, useState } from 'react'
import {
  Alert,
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSubtitle,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Menu,
  Modal,
  PlanLimit,
  SkeletonRows,
  useToast,
} from '../../shared/ui/ledger'

export function FeedbackSection() {
  const toast = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [strongOpen, setStrongOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      setTitleError('Give your page a title.')
      titleRef.current?.focus()
      return
    }
    toast({ title: 'Landing page created', message: `“${title.trim()}” was saved as a draft.` })
    setFormOpen(false)
  }

  const openForm = () => {
    setTitle('')
    setTitleError('')
    setFormOpen(true)
  }

  return (
    <section className="section" id="feedback" aria-labelledby="feedback-title">
      <div className="section__header">
        <div className="stack stack--xs">
          <h2 className="section-title" id="feedback-title">
            Feedback
          </h2>
          <p>Workspace banners sit above every screen; alerts live inside a screen; toasts confirm what just happened.</p>
        </div>
      </div>

      <div className="card sg-banners">
        <Banner tone="warning" icon={CreditCard} title="Your workspace is waiting for payment." action={{ label: 'Complete payment', href: '#feedback', variant: 'primary' }}>
          Publishing pages is paused until the Pro subscription is paid.
        </Banner>
        <Banner tone="info" icon={CalendarClock} title="Your Pro plan ends on 14 Oct 2026." action={{ label: 'Keep my plan', href: '#feedback', variant: 'secondary' }}>
          After that, your workspace moves to the Free plan and its limits.
        </Banner>
        <Banner tone="accent" icon={Landmark} title="Payouts aren’t set up yet." action={{ label: 'Set up payouts', href: '#feedback', variant: 'secondary' }}>
          Connect a Stripe account so your earnings can reach you.
        </Banner>
      </div>

      <div className="grid grid--2">
        <Alert tone="success" icon={CircleCheck} title="Page published">
          It’s live at luma.app/p/mh-studio/adriatic-summer-presets.
        </Alert>
        <Alert tone="warning" icon={TriangleAlert} title="You have unsaved changes">
          Save before leaving the editor or they’ll be lost.
        </Alert>
        <Alert tone="danger" icon={CircleAlert} title="Over your email limit">
          This campaign needs 312 sends but only 180 are left this month.
        </Alert>
        <Alert tone="info" icon={Info} title="How payouts work">
          Stripe sends your earnings automatically. The platform fee is deducted per sale.
        </Alert>
      </div>

      <Card as="div">
        <CardHeader>
          <CardTitle>Overlays</CardTitle>
          <CardSubtitle>Keyboard: Tab, arrows and Esc all work</CardSubtitle>
        </CardHeader>
        <CardBody className="cluster">
          <Button variant="secondary" icon={CircleCheck} onClick={() => toast({ title: 'Campaign scheduled', message: 'It will go out on 2 Oct 2026 at 09:00 to 124 subscribers.' })}>
            Success toast
          </Button>
          <Button variant="secondary" icon={CircleAlert} onClick={() => toast({ tone: 'danger', title: 'Couldn’t publish page', message: 'Your workspace is waiting for payment.' })}>
            Error toast
          </Button>
          <Button variant="secondary" icon={AppWindow} onClick={openForm}>
            Form modal
          </Button>
          <Button variant="secondary" icon={Archive} onClick={() => setConfirmOpen(true)}>
            Confirm dialog
          </Button>
          <Button variant="danger-ghost" icon={Trash2} onClick={() => setStrongOpen(true)}>
            Strong confirmation
          </Button>
          <Menu
            label="Page actions"
            triggerLabel="Dropdown menu"
            triggerIcon={ChevronDown}
            triggerVariant="secondary"
            align="start"
            items={[
              { label: 'Edit page', icon: Pencil, onSelect: () => toast({ tone: 'info', title: 'Edit selected' }) },
              { label: 'View analytics', icon: ChartColumn, onSelect: () => toast({ tone: 'info', title: 'Analytics selected' }) },
              { label: 'Copy link', icon: Link, onSelect: () => toast({ tone: 'info', title: 'Copy link selected' }) },
              'separator',
              { label: 'Archive', icon: Archive, tone: 'danger', onSelect: () => toast({ tone: 'info', title: 'Archive selected' }) },
            ]}
          />
        </CardBody>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New landing page"
        description="Give it a name and a URL — you can change both later."
        icon={PanelsTopLeft}
        tone="accent"
        actions={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="sg-modal-form">
              Create page
            </Button>
          </>
        }
      >
        <form className="form" id="sg-modal-form" noValidate onSubmit={submitForm}>
          <Field label="Page title" error={titleError || undefined}>
            {(control) => (
              <Input
                {...control}
                ref={titleRef}
                name="title"
                type="text"
                placeholder="e.g. Autumn Presets"
                data-autofocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            )}
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Archive this page?"
        text="Visitors will no longer be able to open it. You can restore it from “Show archived” at any time."
        confirmLabel="Archive page"
        tone="warning"
        icon={Archive}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          toast({ title: 'Page archived' })
        }}
      />

      <ConfirmDialog
        open={strongOpen}
        title="Delete workspace?"
        text="This permanently deletes MH Studio with all pages, products, orders and subscribers. This can’t be undone."
        confirmLabel="Delete workspace"
        requireText="MH Studio"
        onCancel={() => setStrongOpen(false)}
        onConfirm={() => {
          setStrongOpen(false)
          toast({ tone: 'info', title: 'Demo only', message: 'Nothing was deleted.' })
        }}
      />
    </section>
  )
}

export function StatesSection() {
  const [errorLoading, setErrorLoading] = useState(false)
  const toast = useToast()

  const retry = () => {
    setErrorLoading(true)
    setTimeout(() => setErrorLoading(false), 1100)
  }

  return (
    <section className="section" id="states" aria-labelledby="states-title">
      <div className="section__header">
        <div className="stack stack--xs">
          <h2 className="section-title" id="states-title">
            Screen states
          </h2>
          <p>
            Every data screen supports these. On real screens they come from the data: loading while fetching, then empty, error or the
            plan limit.
          </p>
        </div>
      </div>
      <div className="grid grid--2 grid--gap-lg">
        <Card as="div">
          <CardHeader>
            <CardTitle>Loading</CardTitle>
          </CardHeader>
          <CardBody flush>
            <SkeletonRows count={4} />
          </CardBody>
        </Card>
        <Card as="div">
          <CardHeader>
            <CardTitle>Empty</CardTitle>
          </CardHeader>
          <CardBody flush>
            <EmptyState
              icon={Package}
              title="No products yet"
              text="Create your first product — a download, a course or a service — and sell it from a landing page."
              action={{ label: 'Create product', icon: Plus, onClick: () => toast({ tone: 'info', title: 'Opens the product form' }) }}
              compact
            />
          </CardBody>
        </Card>
        <Card as="div">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardBody flush>
            {errorLoading ? <SkeletonRows count={3} /> : <ErrorState title="Couldn’t load orders" onRetry={retry} compact />}
          </CardBody>
        </Card>
        <Card as="div">
          <CardHeader>
            <CardTitle>Plan limit</CardTitle>
          </CardHeader>
          <CardBody className="stack">
            <PlanLimit noun="landing pages" planName="Pro" limit={20} upgradeTo="/" />
            <div className="cluster">
              <Button variant="primary" icon={Plus} disabledReason="You’ve used 20 of 20 landing pages on Pro. Upgrade to add more.">
                New landing page
              </Button>
              <span className="text-sm text-muted">Primary action stays visible, disabled, and explains why.</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  )
}
