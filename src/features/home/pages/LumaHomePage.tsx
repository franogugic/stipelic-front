import {
  ArrowRight,
  Check,
  ChartNoAxesCombined,
  CreditCard,
  GripVertical,
  Landmark,
  Lock,
  Mail,
  MailOpen,
  PanelsTopLeft,
  Play,
  Plus,
  ShoppingBag,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { monogram } from '../../../shared/lib/format'
import { PRIVACY_URL, TERMS_URL, isLinked } from '../../../shared/lib/legal-links'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { Avatar, Brand, Button, ThemeToggleButton } from '../../../shared/ui/ledger'
import { AnalyticsVisual, AudienceVisual, EmailVisual, HeroMock } from '../components/MockVisuals'
import { PricingPlans } from '../components/PricingPlans'
import { MOCK_COUNTRIES, MOCK_CREATORS, SUPPORT_EMAIL, faqItems } from '../model/home-content'
import { usePageChrome, useScrollReveal } from '../model/use-page-chrome'

/** The public marketing page of Luma at `/`, for logged-out visitors. Markup and classes from designer-prototype/app/home.html. */
export function LumaHomePage() {
  useDocumentTitle('Luma — Sell what you make. Keep what you earn.')
  usePageChrome()
  useScrollReveal(null)


  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="mk-nav">
        <div className="mk-wrap mk-nav__inner">
          <span>
            <Brand to="/" />
          </span>
          <nav className="mk-nav__links" aria-label="Sections">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#payouts">Payouts</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="mk-nav__actions">
            <ThemeToggleButton size="sm" />
            <Button to="/login" variant="ghost" size="sm" className="mk-hide-sm">
              Log in
            </Button>
            <Button to="/register" variant="accent" size="sm">
              Start free
            </Button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {/* Hero */}
        <section className="mk-hero" aria-labelledby="hero-title">
          <div className="mk-hero__grid" aria-hidden="true" />
          <div className="mk-wrap mk-hero__text">
            <a className="mk-pill" href="#payouts" data-reveal>
              <span className="mk-pill__tag">New</span>
              <span>Bank payouts for creators in Serbia, BiH &amp; Montenegro</span>
              <ArrowRight />
            </a>
            <h1 className="mk-hero__title" id="hero-title" data-reveal>
              Sell what you make.
              <br />
              Keep what you <em>earn.</em>
            </h1>
            <p className="mk-hero__lead" data-reveal>
              A landing page that sells, card checkout, email campaigns and payouts — one calm place to run your creative
              business, built for the Balkans.
            </p>
            <div className="mk-hero__ctas" data-reveal>
              <Button to="/register" variant="accent" size="lg">
                <span>Start free</span>
                <ArrowRight />
              </Button>
              <Button href="#how" variant="secondary" size="lg" icon={Play}>
                See how it works
              </Button>
            </div>
            <ul className="mk-hero__fine" role="list" data-reveal>
              <li>
                <Check />
                Free plan, forever
              </li>
              <li>
                <Check />
                No card needed
              </li>
              <li>
                <Check />
                Live in five minutes
              </li>
            </ul>
          </div>

          <div className="mk-wrap mk-stage" data-reveal>
            <div className="mk-stage__glow" aria-hidden="true" />
            <div className="mk-stage__frame" aria-hidden="true">
              <HeroMock />
            </div>

            <div className="mk-float mk-float--order" aria-hidden="true">
              <span className="mk-float__icon mk-float__icon--accent">
                <ShoppingBag />
              </span>
              <div>
                <p className="mk-float__label">New order · just now</p>
                <p className="mk-float__value">Brand Identity Masterclass</p>
              </div>
              <span className="mk-float__amount">€149.00</span>
            </div>
            <div className="mk-float mk-float--payout" aria-hidden="true">
              <span className="mk-float__icon">
                <Landmark />
              </span>
              <div>
                <p className="mk-float__label">Payout sent</p>
                <p className="mk-float__value">€820.00 → RS35 •••• 1379</p>
              </div>
            </div>
            <div className="mk-float mk-float--email" aria-hidden="true">
              <span className="mk-float__icon">
                <MailOpen />
              </span>
              <div>
                <p className="mk-float__label">September studio notes</p>
                <p className="mk-float__value">
                  <strong>54%</strong> opened
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Creators marquee */}
        <section className="mk-proof" aria-label="Creators using Luma">
          <p className="mk-proof__label">Independent creators from Triglav to Ohrid sell with Luma</p>
          <div className="mk-marquee">
            <ul className="mk-marquee__track" role="list">
              {/* Rendered twice so the loop is seamless; the copy is hidden from assistive tech. */}
              {[false, true].flatMap((copy) =>
                MOCK_CREATORS.map(([name, city]) => (
                  <li key={`${copy}-${name}`} aria-hidden={copy ? true : undefined}>
                    <Avatar size="sm" neutral>
                      {monogram(name)}
                    </Avatar>
                    <span className="mk-marquee__name">{name}</span>
                    <span className="mk-marquee__city">{city}</span>
                  </li>
                )),
              )}
            </ul>
          </div>
        </section>

        {/* Features bento */}
        <section className="mk-section" id="features" aria-labelledby="features-title">
          <div className="mk-wrap">
            <header className="mk-head" data-reveal>
              <p className="eyebrow">Everything in one place</p>
              <h2 className="mk-h2" id="features-title">
                Five tools you used to glue together. <em>Now one.</em>
              </h2>
              <p className="mk-head__lead">
                Stop stitching a page builder, a payment link, a newsletter tool and a spreadsheet. Luma does the whole loop —
                from first visit to money in your account.
              </p>
            </header>

            <div className="mk-bento">
              <article className="mk-cell mk-cell--pages" data-reveal>
                <div className="mk-cell__text">
                  <span className="mk-cell__icon">
                    <PanelsTopLeft />
                  </span>
                  <h3 className="mk-cell__title">Pages that sell</h3>
                  <p className="mk-cell__lead">
                    Stack sections, drag to reorder, drop in your brand. Publish to <span className="mono">luma.app/p/you</span> in
                    minutes — no code, no template look.
                  </p>
                </div>
                <div className="mk-builder" aria-hidden="true">
                  <ul className="mk-builder__list" role="list">
                    <li>
                      <GripVertical />
                      Navbar
                    </li>
                    <li className="is-active">
                      <GripVertical />
                      Hero
                    </li>
                    <li>
                      <GripVertical />
                      Features
                    </li>
                    <li className="is-dragging">
                      <GripVertical />
                      Testimonials
                    </li>
                    <li>
                      <GripVertical />
                      FAQ
                    </li>
                  </ul>
                  <div className="mk-builder__page">
                    <div className="mk-builder__visual" />
                    <p className="mk-builder__title">
                      Golden hour, <em>all summer</em> long.
                    </p>
                    <span className="mk-builder__cta">Buy now — €29</span>
                  </div>
                </div>
              </article>

              <article className="mk-cell mk-cell--checkout" data-reveal>
                <div className="mk-cell__text">
                  <span className="mk-cell__icon">
                    <CreditCard />
                  </span>
                  <h3 className="mk-cell__title">Checkout in one tap</h3>
                  <p className="mk-cell__lead">
                    Secure card payments by Stripe. Buyers get your product by email the moment they pay.
                  </p>
                </div>
                <div className="mk-checkout" aria-hidden="true">
                  <div className="mk-checkout__row">
                    <span className="cover cover--thumb cover--sunset" />
                    <span className="mk-checkout__name">
                      Adriatic Summer Presets<small>12 Lightroom presets</small>
                    </span>
                    <strong>€29.00</strong>
                  </div>
                  <div className="mk-checkout__field">
                    <CreditCard />
                    <span>•••• •••• •••• 4242</span>
                    <span>12/28</span>
                  </div>
                  <div className="mk-checkout__pay">Pay €29.00</div>
                  <p className="mk-checkout__secure">
                    <Lock />
                    Secured by Stripe
                  </p>
                </div>
              </article>

              <article className="mk-cell mk-cell--email" data-reveal>
                <div className="mk-cell__text">
                  <span className="mk-cell__icon">
                    <Mail />
                  </span>
                  <h3 className="mk-cell__title">Email that gets opened</h3>
                  <p className="mk-cell__lead">
                    Send to everyone, one page’s audience or one product’s buyers. Schedule it, preview it, watch it land.
                  </p>
                </div>
                <div className="mk-cell__visual" aria-hidden="true">
                  <EmailVisual />
                </div>
              </article>

              <article className="mk-cell mk-cell--analytics" data-reveal>
                <div className="mk-cell__text">
                  <span className="mk-cell__icon">
                    <ChartNoAxesCombined />
                  </span>
                  <h3 className="mk-cell__title">Know what works</h3>
                  <p className="mk-cell__lead">
                    Views, sales, emails and revenue per page and per product — today, this week, all time.
                  </p>
                </div>
                <div className="mk-cell__visual" aria-hidden="true">
                  <AnalyticsVisual />
                </div>
              </article>

              <article className="mk-cell mk-cell--audience" data-reveal>
                <div className="mk-cell__text">
                  <span className="mk-cell__icon">
                    <Users />
                  </span>
                  <h3 className="mk-cell__title">An audience you own</h3>
                  <p className="mk-cell__lead">Every email collected is yours — with the page it came from.</p>
                </div>
                <div className="mk-audience" aria-hidden="true">
                  <AudienceVisual />
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mk-section mk-section--tint" id="how" aria-labelledby="how-title">
          <div className="mk-wrap">
            <header className="mk-head" data-reveal>
              <p className="eyebrow">How it works</p>
              <h2 className="mk-h2" id="how-title">
                From idea to income in <em>three steps.</em>
              </h2>
            </header>
            <ol className="mk-steps" role="list">
              <li className="mk-step" data-reveal>
                <span className="mk-step__num">01</span>
                <h3 className="mk-step__title">Build your page</h3>
                <p className="mk-step__text">
                  Pick sections, add your logo and colour, connect a product. Your page lives at{' '}
                  <span className="mono">luma.app/p/your-name</span>.
                </p>
              </li>
              <li className="mk-step" data-reveal>
                <span className="mk-step__num">02</span>
                <h3 className="mk-step__title">Sell or collect emails</h3>
                <p className="mk-step__text">
                  Sales pages take card payments. Lead pages grow your list with a free guide or a waitlist.
                </p>
              </li>
              <li className="mk-step" data-reveal>
                <span className="mk-step__num">03</span>
                <h3 className="mk-step__title">Get paid</h3>
                <p className="mk-step__text">
                  Straight to your Stripe account — or, where Stripe doesn’t reach, a bank transfer to any IBAN.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* Payouts / region */}
        <section className="mk-section mk-ink" id="payouts" aria-labelledby="payouts-title">
          <div className="mk-wrap mk-payouts">
            <div className="mk-payouts__text" data-reveal>
              <p className="eyebrow mk-ink__eyebrow">Paid everywhere in the region</p>
              <h2 className="mk-h2" id="payouts-title">
                Stripe doesn’t cover Belgrade or Sarajevo. <em>We do.</em>
              </h2>
              <p className="mk-head__lead">
                Where Stripe works, money goes straight to your account. Everywhere else, Luma collects your sales and pays
                them out to your bank on request — no workarounds, no foreign company needed.
              </p>
              <dl className="mk-stats">
                <div>
                  <dt>Countries</dt>
                  <dd>{MOCK_COUNTRIES.length}</dd>
                </div>
                <div>
                  <dt>Code needed</dt>
                  <dd>0</dd>
                </div>
              </dl>
            </div>
            <ul className="mk-countries" role="list" data-reveal>
              {MOCK_COUNTRIES.map((country) => {
                const iban = country.payout === 'iban'
                const Icon = iban ? Landmark : Zap
                return (
                  <li className="mk-country" key={country.code}>
                    <span className="mk-country__code">{country.code}</span>
                    <span className="mk-country__name">{country.name}</span>
                    <span className={['mk-country__method', iban && 'is-iban'].filter(Boolean).join(' ')}>
                      <Icon />
                      {iban ? 'Bank transfer' : 'Stripe'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* Quote */}
        <section className="mk-section mk-quote" aria-label="What creators say">
          <div className="mk-wrap">
            <figure className="mk-quote__figure" data-reveal>
              <blockquote className="mk-quote__text">
                “I moved my presets from three different tools to Luma in an afternoon.{' '}
                <span className="mark">The first sale came in before dinner.</span>”
              </blockquote>
              <figcaption className="mk-quote__by">
                <Avatar size="lg">MH</Avatar>
                <span>
                  <strong>Marko Horvat</strong>
                  <span className="text-muted">Photographer &amp; designer, Split</span>
                </span>
              </figcaption>
            </figure>
            <div className="mk-quotes">
              <figure className="mk-mini-quote" data-reveal>
                <blockquote>“My readers in Bosnia can finally pay me, and I get paid to my own bank.”</blockquote>
                <figcaption>
                  <Avatar size="sm" neutral>
                    LO
                  </Avatar>
                  Lejla Omerović · Lejla Writes
                </figcaption>
              </figure>
              <figure className="mk-mini-quote" data-reveal>
                <blockquote>“The dashboard is the first thing I open every morning. It’s calm, and it’s all there.”</blockquote>
                <figcaption>
                  <Avatar size="sm" neutral>
                    AS
                  </Avatar>
                  Ana Stojanovska · Ana Illustrates
                </figcaption>
              </figure>
              <figure className="mk-mini-quote" data-reveal>
                <blockquote>“54% open rate on my launch email. I didn’t know that was possible.”</blockquote>
                <figcaption>
                  <Avatar size="sm" neutral>
                    SN
                  </Avatar>
                  Stefan Nikolić · Nikolić Fitness
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mk-section mk-section--tint" id="pricing" aria-labelledby="pricing-title">
          <div className="mk-wrap">
            <header className="mk-head mk-head--center" data-reveal>
              <p className="eyebrow">Pricing</p>
              <h2 className="mk-h2" id="pricing-title">
                Simple plans. <em>More room</em> as you grow.
              </h2>
              <p className="mk-head__lead">
                Start free. Upgrade when your sales make it worth it — every plan includes pages, checkout, email and payouts.
              </p>
            </header>
            <PricingPlans />
          </div>
        </section>

        {/* FAQ */}
        <section className="mk-section" id="faq" aria-labelledby="faq-title">
          <div className="mk-wrap mk-faq">
            <header className="mk-head" data-reveal>
              <p className="eyebrow">FAQ</p>
              <h2 className="mk-h2" id="faq-title">
                Good <em>questions.</em>
              </h2>
              {SUPPORT_EMAIL && (
                <p className="mk-head__lead">
                  Something else? Write to{' '}
                  <a className="link" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  — a person answers.
                </p>
              )}
            </header>
            <div className="mk-faq__list" data-reveal>
              {faqItems().map((item, index) => (
                <details key={item.question} open={index === 0 ? true : undefined}>
                  <summary>
                    {item.question}
                    <Plus />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mk-final mk-ink" aria-labelledby="final-title">
          <div className="mk-wrap mk-final__inner" data-reveal>
            <h2 className="mk-final__title" id="final-title">
              Your next sale starts <em>here.</em>
            </h2>
            <p className="mk-head__lead">Free to start. Your first page is five minutes away.</p>
            <div className="mk-hero__ctas">
              <Button to="/register" variant="accent" size="lg">
                <span>Start free</span>
                <ArrowRight />
              </Button>
              <Link className="btn btn--lg mk-btn-ghost-ink" to="/login">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mk-footer">
        <div className="mk-wrap mk-footer__grid">
          <div className="stack stack--md">
            <span>
              <Brand to="/" />
            </span>
            <p className="text-sm text-secondary">Landing pages, checkout, email and payouts for creators across the Balkans.</p>
          </div>
          <nav className="mk-footer__col" aria-label="Product">
            <p className="eyebrow">Product</p>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#payouts">Payouts</a>
          </nav>
          <nav className="mk-footer__col" aria-label="Account">
            <p className="eyebrow">Account</p>
            <Link to="/login">Log in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/forgot-password">Forgot password</Link>
          </nav>
          {(isLinked(TERMS_URL) || isLinked(PRIVACY_URL) || SUPPORT_EMAIL) && (
            <nav className="mk-footer__col" aria-label="Legal">
              <p className="eyebrow">Legal</p>
              {isLinked(TERMS_URL) && <a href={TERMS_URL}>Terms of Service</a>}
              {isLinked(PRIVACY_URL) && <a href={PRIVACY_URL}>Privacy Policy</a>}
              {SUPPORT_EMAIL && <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>}
            </nav>
          )}
        </div>
        <div className="mk-wrap mk-footer__bottom">
          <span>© 2026 Luma</span>
          <span>Made on the Adriatic</span>
        </div>
      </footer>
    </>
  )
}
