import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, PricingPageDto } from '../../services/api.service';
import { formatUsd, MEMORA_DISPLAY_PLANS } from '../../constants/display-plans';

@Component({
  selector: 'app-pricing-obituary',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="pricing-page">
      <header class="pricing-hero">
        <div class="container hero-wrap">
          <div class="hero-band">
            <div class="hero-glow" aria-hidden="true"></div>
            <div class="hero-inner">
              <p class="hero-kicker">
                <span class="hero-kicker-rule" aria-hidden="true"></span>
                Memora
                <span class="hero-kicker-rule" aria-hidden="true"></span>
              </p>
              <h1>Pricing</h1>
              <p class="hero-lede">
                Simple display plans for publishing life-event notices—same rates for every event type and region.
              </p>
              <a routerLink="/contact" class="hero-cta">Questions? Contact us</a>
            </div>
          </div>
        </div>
      </header>

      <div class="container pricing-shell">
        @if (loading()) {
          <div class="lift-card status-card" aria-busy="true">
            <div class="status-shimmer"></div>
            <p class="status-label">Loading pricing…</p>
          </div>
        } @else if (error()) {
          <div class="lift-card status-card status-card--error" role="alert">
            <p class="status-msg">{{ error() }}</p>
          </div>
        } @else if (pricing()) {
          <section class="lift-card hotline-card">
            <div class="hotline-icon-wrap" aria-hidden="true">
              <svg class="hotline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                />
              </svg>
            </div>
            <p class="hotline-label">24/7 international hotline</p>
            <a class="hotline-number" [href]="'tel:' + telHref(pricing()!.hotlineInternational)">{{
              pricing()!.hotlineInternational
            }}</a>
            <p class="hotline-note">If local numbers below are unreachable, use this line—we’re here around the clock.</p>
            <div class="local-numbers">
              @for (num of pricing()!.localNumbers; track num) {
                <a class="local-num" [href]="'tel:' + telHref(num)">{{ num }}</a>
              }
            </div>
          </section>

          <section class="lift-card pricing-panel">
            <div class="panel-head">
              <h2 class="panel-title">Display plans</h2>
              <p class="panel-meta">All amounts in <strong>USD</strong></p>
            </div>
            <div class="table-scroll">
              <table class="plans-table">
                <thead>
                  <tr>
                    <th scope="col">Duration</th>
                    <th scope="col">Price</th>
                  </tr>
                </thead>
                <tbody>
                  @for (plan of displayPlans; track plan.days; let idx = $index) {
                    <tr [class.is-rec]="idx === recommendedIndex">
                      <th scope="row">
                        @if (idx === recommendedIndex) {
                          <span class="row-badge">Popular</span>
                        }
                        {{ plan.label }}
                      </th>
                      <td>{{ formatUsd(plan.price) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="legend">*Terms apply.</p>
          </section>

          @for (section of pricing()!.contentSections; track section.heading) {
            <section class="lift-card prose-card">
              <h3 class="prose-title">{{ section.heading }}</h3>
              <ul class="prose-list">
                @for (item of section.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </section>
          }

          <section class="lift-card payment-card">
            <h3 class="prose-title">Payment methods</h3>
            <div class="payment-chips">
              @for (m of pricing()!.paymentMethods; track m) {
                <span class="chip chip--payment">
                  <img
                    class="pay-logo"
                    [src]="paymentIconSrc(m)"
                    width="44"
                    height="28"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="chip-label">{{ m }}</span>
                </span>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .pricing-page {
      min-height: 100%;
      padding-bottom: 2.5rem;
    }

    .pricing-hero {
      background: transparent;
      padding: 0.35rem 0 0;
      margin-bottom: 1.35rem;
    }
    .hero-wrap {
      display: flex;
      justify-content: center;
      padding: 0 1.25rem;
    }
    .hero-band {
      position: relative;
      overflow: hidden;
      width: 100%;
      max-width: 560px;
      padding: 0.95rem 1.35rem 1.05rem;
      border-radius: 18px;
      background: linear-gradient(152deg, #0e3a30 0%, #164d40 38%, #1f6a53 72%, #287860 100%);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow:
        0 4px 6px rgba(13, 61, 50, 0.06),
        0 18px 38px rgba(13, 61, 50, 0.14),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    .hero-glow {
      position: absolute;
      inset: -35% 10% auto -15%;
      height: 140%;
      background: radial-gradient(ellipse 55% 48% at 78% 18%, rgba(255, 255, 255, 0.14) 0%, transparent 58%);
      pointer-events: none;
      animation: heroGlowDrift 14s ease-in-out infinite;
    }
    @keyframes heroGlowDrift {
      0%, 100% { opacity: 0.75; transform: translateX(0); }
      50% { opacity: 1; transform: translateX(3%); }
    }
    .hero-inner {
      position: relative;
      z-index: 1;
      text-align: center;
    }
    .hero-kicker {
      margin: 0 0 0.35rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-size: 0.62rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.78);
    }
    .hero-kicker-rule {
      display: inline-block;
      width: 1.35rem;
      height: 2px;
      border-radius: 2px;
      background: linear-gradient(90deg, transparent, rgba(212, 165, 116, 0.85), transparent);
    }
    .pricing-hero h1 {
      margin: 0 0 0.38rem;
      font-family: var(--font-display);
      font-size: clamp(1.28rem, 2.6vw, 1.58rem);
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.03em;
      line-height: 1.2;
    }
    .hero-lede {
      margin: 0 auto 0.65rem;
      max-width: 42ch;
      font-size: 0.82rem;
      font-weight: 400;
      line-height: 1.52;
      letter-spacing: 0.015em;
      color: rgba(255, 255, 255, 0.82);
    }
    .hero-cta {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgba(232, 201, 168, 0.95);
      text-decoration: none;
      border-bottom: 1px solid rgba(232, 201, 168, 0.45);
      padding-bottom: 0.12rem;
      transition: color 0.2s ease, border-color 0.2s ease;
    }
    .hero-cta:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.55);
    }

    .pricing-shell {
      max-width: 720px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .lift-card {
      background: #fff;
      border: 1px solid rgba(26, 95, 74, 0.1);
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(13, 61, 50, 0.06);
      transition:
        transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 0.35s ease,
        border-color 0.25s ease;
    }
    .lift-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 36px rgba(13, 61, 50, 0.11);
      border-color: rgba(26, 95, 74, 0.16);
    }

    .status-card {
      text-align: center;
      padding: 2rem 1.25rem;
      position: relative;
      overflow: hidden;
    }
    .status-card--error {
      background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
      border-color: rgba(185, 28, 28, 0.15);
    }
    .status-msg {
      margin: 0;
      color: #b91c1c;
      font-weight: 600;
      font-size: 0.92rem;
    }
    .status-shimmer {
      width: 56px;
      height: 56px;
      margin: 0 auto 1rem;
      border-radius: 16px;
      background: linear-gradient(90deg, #e8f2ec 0%, #f4faf7 50%, #e8f2ec 100%);
      background-size: 200% 100%;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    .status-label {
      margin: 0;
      font-size: 0.88rem;
      color: #5a6f68;
      font-weight: 600;
    }

    .hotline-card {
      text-align: center;
      padding: 1.45rem 1.25rem 1.5rem;
      position: relative;
      overflow: hidden;
    }
    .hotline-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(236, 246, 241, 0.85) 0%, rgba(255, 255, 255, 0.45) 100%);
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
    }
    .hotline-card:hover::before {
      opacity: 1;
    }
    .hotline-card > * {
      position: relative;
      z-index: 1;
    }
    .hotline-icon-wrap {
      width: 52px;
      height: 52px;
      margin: 0 auto 0.85rem;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: linear-gradient(145deg, #1a5f4a 0%, #2f7e66 100%);
      color: #fff;
      box-shadow: 0 8px 22px rgba(26, 95, 74, 0.35);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease;
    }
    .hotline-card:hover .hotline-icon-wrap {
      transform: scale(1.05) rotate(-3deg);
      box-shadow: 0 12px 28px rgba(26, 95, 74, 0.38);
    }
    .hotline-svg {
      width: 26px;
      height: 26px;
    }
    .hotline-label {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: #46675f;
    }
    .hotline-number {
      display: inline-block;
      margin: 0.55rem 0 0.35rem;
      font-size: clamp(1.35rem, 3vw, 1.65rem);
      font-weight: 800;
      letter-spacing: 0.02em;
      text-decoration: none;
      background: linear-gradient(120deg, #0d3d32 0%, #1f6a53 50%, #2d8f73 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      transition: background-position 0.5s ease;
    }
    .hotline-card:hover .hotline-number {
      background-position: 100% center;
    }
    .hotline-note {
      margin: 0 0 0.85rem;
      font-size: 0.82rem;
      line-height: 1.45;
      color: #5a6f68;
      max-width: 46ch;
      margin-inline: auto;
    }
    .local-numbers {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
      justify-content: center;
    }
    .local-num {
      font-size: 1rem;
      font-weight: 700;
      color: #1a5f4a;
      text-decoration: none;
      padding: 0.35rem 0.6rem;
      border-radius: 10px;
      background: rgba(26, 95, 74, 0.06);
      border: 1px solid rgba(26, 95, 74, 0.12);
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    .local-num:hover {
      background: rgba(26, 95, 74, 0.1);
      border-color: rgba(26, 95, 74, 0.22);
      color: #0d3d32;
    }

    .pricing-panel {
      padding: 0;
      overflow: hidden;
    }
    .panel-head {
      padding: 1.2rem 1.35rem 1rem;
      border-bottom: 1px solid rgba(26, 95, 74, 0.08);
      background: linear-gradient(180deg, rgba(248, 252, 250, 0.9) 0%, #fff 100%);
    }
    .panel-title {
      margin: 0 0 0.25rem;
      font-family: var(--font-display);
      font-size: 1.28rem;
      font-weight: 700;
      color: #0f2922;
    }
    .panel-meta {
      margin: 0;
      font-size: 0.84rem;
      color: #5a6f68;
    }
    .panel-meta strong {
      color: #1a5f4a;
      font-weight: 700;
    }
    .table-scroll {
      overflow-x: auto;
      padding: 0 0 0.25rem;
    }
    .plans-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    .plans-table th,
    .plans-table td {
      padding: 0.85rem 1.35rem;
      text-align: left;
      font-size: 0.92rem;
      border-bottom: 1px solid rgba(26, 95, 74, 0.08);
      vertical-align: middle;
    }
    .plans-table thead th {
      background: rgba(248, 252, 250, 0.95);
      font-weight: 700;
      color: #0f2922;
      border-bottom: 1px solid rgba(26, 95, 74, 0.12);
    }
    .plans-table tbody th[scope='row'] {
      font-weight: 600;
      color: #2c3d38;
      background: #fff;
    }
    .plans-table tbody td {
      font-weight: 700;
      color: #1a5f4a;
      text-align: right;
    }
    .plans-table tbody tr:last-child th,
    .plans-table tbody tr:last-child td {
      border-bottom: none;
    }
    .row-badge {
      display: inline-block;
      margin-right: 0.45rem;
      font-size: 0.58rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8a6a3a;
      padding: 0.2rem 0.45rem;
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(212, 165, 116, 0.22) 0%, rgba(232, 201, 168, 0.35) 100%);
      border: 1px solid rgba(212, 165, 116, 0.35);
      vertical-align: middle;
    }
    .plans-table tr.is-rec {
      background: rgba(236, 246, 241, 0.55);
    }
    .legend {
      margin: 0;
      padding: 0.85rem 1.35rem 1.15rem;
      font-size: 0.78rem;
      color: #6f8079;
      border-top: 1px solid rgba(26, 95, 74, 0.06);
      background: rgba(252, 252, 251, 0.8);
    }

    .prose-card {
      padding: 1.15rem 1.35rem 1.25rem;
    }
    .payment-card {
      padding: 1.15rem 1.35rem 1.35rem;
    }
    .prose-title {
      margin: 0 0 0.75rem;
      font-family: var(--font-display);
      font-size: 1.08rem;
      font-weight: 700;
      color: #0f2922;
    }
    .prose-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .prose-list li {
      position: relative;
      padding-left: 1.15rem;
      font-size: 0.88rem;
      line-height: 1.55;
      color: #3d4f49;
    }
    .prose-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: linear-gradient(145deg, #1a5f4a, #2d8f73);
      opacity: 0.85;
    }

    .payment-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      align-items: stretch;
    }
    .chip {
      padding: 0.42rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #2c3d38;
      background: rgba(248, 252, 250, 0.95);
      border: 1px solid rgba(26, 95, 74, 0.14);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .chip--payment {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.38rem 0.85rem 0.38rem 0.42rem;
      border-radius: 12px;
    }
    .pay-logo {
      flex-shrink: 0;
      width: 44px;
      height: 28px;
      object-fit: contain;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(13, 61, 50, 0.08);
    }
    .chip-label {
      line-height: 1.2;
    }
    .lift-card:hover .chip {
      border-color: rgba(26, 95, 74, 0.22);
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-glow {
        animation: none;
      }
      .status-shimmer {
        animation: none;
      }
      .lift-card:hover {
        transform: none;
      }
      .hotline-card:hover .hotline-icon-wrap {
        transform: none;
      }
      .hotline-card:hover .hotline-number {
        background-position: 0 center;
      }
    }
  `]
})
export class PricingObituaryComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  pricing = signal<PricingPageDto | null>(null);

  readonly displayPlans = MEMORA_DISPLAY_PLANS;
  readonly formatUsd = formatUsd;
  readonly recommendedIndex = 1;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadPricing();
  }

  telHref(phone: string): string {
    const trimmed = phone.trim();
    const digits = trimmed.replace(/[^\d]/g, '');
    return digits || trimmed;
  }

  paymentIconSrc(method: string): string {
    const key = method.trim().toLowerCase();
    if (key.includes('visa')) return 'assets/payments/visa.svg';
    if (key.includes('mastercard')) return 'assets/payments/mastercard.svg';
    if (key.includes('paypal')) return 'assets/payments/paypal.svg';
    if (key.includes('american express') || /\bamex\b/.test(key)) return 'assets/payments/amex.svg';
    if (key.includes('bank')) return 'assets/payments/bank-transfer.svg';
    if (key.includes('western')) return 'assets/payments/western-union.svg';
    return 'assets/payments/card-generic.svg';
  }

  private loadPricing(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getPricingPage('obituary', 'srilanka').subscribe({
      next: (res) => {
        this.pricing.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Unable to load pricing right now.');
        this.loading.set(false);
      }
    });
  }
}
