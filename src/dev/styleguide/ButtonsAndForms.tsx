import { Copy, Ellipsis, Eye, EyeOff, MailPlus, Plus, Rocket, ShoppingBag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSubtitle,
  CardTitle,
  Checkbox,
  Choice,
  ColorField,
  Field,
  Input,
  InputAddon,
  InputGroup,
  Segmented,
  SearchInput,
  Select,
  Switch,
  Textarea,
  Uploader,
  useToast,
} from '../../shared/ui/ledger'

export function ButtonsSection() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const save = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      toast({ title: 'Changes saved' })
    }, 1200)
  }

  return (
    <section className="section" id="buttons" aria-labelledby="buttons-title">
      <div className="section__header">
        <div className="stack stack--xs">
          <h2 className="section-title" id="buttons-title">
            Buttons
          </h2>
          <p>Ink for the main action of a screen, volt for money and publishing moments, secondary and ghost for the rest.</p>
        </div>
      </div>
      <div className="card">
        <div className="card__body stack stack--lg">
          <div className="sg-row">
            <span className="sg-row__label">Variants</span>
            <div className="cluster">
              <Button variant="primary" icon={Plus}>
                New product
              </Button>
              <Button variant="accent" icon={Rocket}>
                Publish
              </Button>
              <Button variant="secondary" icon={Eye}>
                Preview
              </Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger" icon={Trash2}>
                Delete
              </Button>
              <Button variant="danger-ghost">Remove</Button>
            </div>
          </div>
          <div className="sg-row">
            <span className="sg-row__label">Sizes</span>
            <div className="cluster">
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary">Medium</Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
              <Button variant="secondary" iconOnly icon={Copy} aria-label="Copy link" data-tooltip="Copy link" />
              <Button variant="ghost" size="sm" iconOnly icon={Ellipsis} aria-label="More actions" data-tooltip="More actions" />
            </div>
          </div>
          <div className="sg-row">
            <span className="sg-row__label">States</span>
            <div className="cluster">
              <Button variant="primary" loading={busy} onClick={save}>
                Save changes
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                disabledReason="You’ve used 20 of 20 landing pages on Pro. Upgrade to add more."
              >
                New landing page
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function FormsSection() {
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [pageType, setPageType] = useState('lead')
  const [showPrice, setShowPrice] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [showArchived, setShowArchived] = useState(true)
  const [agree, setAgree] = useState(false)
  const [color, setColor] = useState('#E2553A')
  const [period, setPeriod] = useState('7d')
  const [search, setSearch] = useState('')
  const [upload, setUpload] = useState<{ url: string; name: string } | null>(null)
  const [uploading, setUploading] = useState<{ name: string; progress: number } | null>(null)

  // The specimen fakes an upload with a timer — real uploads arrive with the screens that need them.
  const startUpload = (file: File) => {
    setUploading({ name: file.name, progress: 0 })
    let progress = 0
    const timer = setInterval(() => {
      progress = Math.min(100, progress + 7 + Math.round(Math.random() * 12))
      if (progress < 100) {
        setUploading({ name: file.name, progress })
        return
      }
      clearInterval(timer)
      setUploading(null)
      setUpload({ url: URL.createObjectURL(file), name: file.name })
      toast({ title: 'Image uploaded', message: file.name })
    }, 90)
  }

  return (
    <section className="section" id="forms" aria-labelledby="forms-title">
      <div className="section__header">
        <div className="stack stack--xs">
          <h2 className="section-title" id="forms-title">
            Forms
          </h2>
          <p>Labels always visible, hints under the field, errors in plain language next to the problem.</p>
        </div>
      </div>
      <div className="grid grid--2 grid--gap-lg">
        <Card as="div">
          <CardHeader>
            <CardTitle>Text fields</CardTitle>
          </CardHeader>
          <CardBody className="form">
            <Field label="Product name">{(control) => <Input {...control} type="text" defaultValue="Adriatic Summer Presets" />}</Field>
            <Field label="Page URL" hint="Lowercase letters, numbers and dashes.">
              {(control) => (
                <InputGroup>
                  <InputAddon>luma.app/p/mh-studio/</InputAddon>
                  <Input {...control} type="text" defaultValue="summer-presets" />
                </InputGroup>
              )}
            </Field>
            <div className="form-row">
              <Field label="Price">
                {(control) => (
                  <InputGroup>
                    <InputAddon>€</InputAddon>
                    <Input {...control} className="num" type="text" inputMode="decimal" defaultValue="29.00" />
                  </InputGroup>
                )}
              </Field>
              <Field label="Type">
                {(control) => (
                  <Select {...control}>
                    <option>Digital</option>
                    <option>Service</option>
                    <option>Course</option>
                  </Select>
                )}
              </Field>
            </div>
            <Field label="Support email" optional error="Enter a full email address, like hello@mhstudio.hr.">
              {(control) => <Input {...control} type="email" defaultValue="hello@mhstudio" />}
            </Field>
            <Field label="Password">
              {(control) => (
                <InputGroup>
                  <Input {...control} type={showPassword ? 'text' : 'password'} defaultValue="Adriatic2026" autoComplete="new-password" />
                  <InputAddon plain>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={showPassword ? EyeOff : Eye}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((visible) => !visible)}
                    />
                  </InputAddon>
                </InputGroup>
              )}
            </Field>
            <Field label="Message">
              {(control) => (
                <Textarea
                  {...control}
                  defaultValue={'Hi there,\n\nVolume 2 of the UI kit is almost ready and subscribers get it first.'}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        <div className="stack stack--lg">
          <Card as="div">
            <CardHeader>
              <CardTitle>Choices</CardTitle>
            </CardHeader>
            <CardBody className="form">
              <fieldset className="sg-fieldset">
                <legend className="field__label">Page type</legend>
                <div className="grid grid--2">
                  <Choice
                    name="sg-page-type"
                    value="lead"
                    checked={pageType === 'lead'}
                    onChange={() => setPageType('lead')}
                    visual={
                      <Badge tone="info" icon={MailPlus}>
                        Lead capture
                      </Badge>
                    }
                    title="Collect emails"
                    text="A free offer in exchange for an email address."
                  />
                  <Choice
                    name="sg-page-type"
                    value="sales"
                    checked={pageType === 'sales'}
                    onChange={() => setPageType('sales')}
                    visual={
                      <Badge tone="accent" icon={ShoppingBag}>
                        Sales
                      </Badge>
                    }
                    title="Sell a product"
                    text="Card checkout through Stripe, delivered by email."
                  />
                </div>
              </fieldset>
              <div className="cluster cluster--lg">
                <Checkbox label="Show price" checked={showPrice} onChange={(event) => setShowPrice(event.target.checked)} />
                <Checkbox type="radio" name="sg-radio" label="EUR" checked={currency === 'EUR'} onChange={() => setCurrency('EUR')} />
                <Checkbox type="radio" name="sg-radio" label="USD" checked={currency === 'USD'} onChange={() => setCurrency('USD')} />
                <Switch label="Show archived" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
              </div>
              <Checkbox
                label="I agree to the Terms of Service"
                hint="You can read them any time in Settings."
                checked={agree}
                onChange={(event) => setAgree(event.target.checked)}
              />
              <div className="form-row">
                <Field label="Primary colour">{(control) => <ColorField id={control.id} value={color} onChange={setColor} aria-label="Primary colour hex value" />}</Field>
                <div className="field">
                  <span className="field__label" id="sg-period-label">
                    Period
                  </span>
                  <Segmented
                    label="Period"
                    name="sg-period"
                    value={period}
                    onChange={setPeriod}
                    options={['24h', '7d', '30d', '1y'].map((value) => ({ value, label: value }))}
                  />
                </div>
              </div>
              <Field label="Search">
                {(control) => (
                  <SearchInput {...control} placeholder="Search by email" value={search} onChange={(event) => setSearch(event.target.value)} />
                )}
              </Field>
            </CardBody>
          </Card>

          <Card as="div">
            <CardHeader>
              <CardTitle>Image upload</CardTitle>
              <CardSubtitle>Try it — drop or pick any image</CardSubtitle>
            </CardHeader>
            <CardBody className="field">
              <Uploader
                label="Product thumbnail"
                aspect="wide"
                value={upload?.url}
                fileName={uploading?.name ?? upload?.name}
                uploading={Boolean(uploading)}
                progress={uploading?.progress}
                onSelect={startUpload}
                onRemove={() => setUpload(null)}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  )
}

// The chips and avatars card belongs to the Data display section of the styleguide.
export function ChipsAndAvatarsCard() {
  const [source, setSource] = useState('All sources')
  return (
    <Card as="div">
      <CardHeader>
        <CardTitle>Filter chips &amp; avatars</CardTitle>
      </CardHeader>
      <CardBody className="stack">
        <div className="cluster cluster--sm" role="group" aria-label="Filter by source">
          {['All sources', 'Color Grading Guide', 'Adriatic Presets'].map((label) => (
            <button key={label} className="chip" type="button" aria-pressed={source === label} onClick={() => setSource(label)}>
              {label}
            </button>
          ))}
        </div>
        <div className="cluster">
          <Avatar size="xs">MH</Avatar>
          <Avatar size="sm">MH</Avatar>
          <Avatar>MH</Avatar>
          <Avatar size="lg">MH</Avatar>
          <Avatar size="xl">MH</Avatar>
          <Avatar size="lg" neutral>
            AK
          </Avatar>
        </div>
      </CardBody>
    </Card>
  )
}
