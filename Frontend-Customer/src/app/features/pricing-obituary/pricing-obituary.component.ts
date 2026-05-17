import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, PricingPageDto } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AuthUiService } from '../../services/auth-ui.service';
import {
  MEMORA_EVENT_TYPES,
  labelForPricingSlug,
  normalizePricingSlugFromRoute
} from '../../constants/memora-event-types';

@Component({
  selector: 'app-pricing-obituary',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
                Compare display packages by event type and region—birthdays, ceremonies, weddings, anniversaries, obituaries,
                remembrance, and more.
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
          </section>

          <section class="lift-card selectors-card">
            <h2 class="card-heading">Your selections</h2>
            <p class="card-sub">Choose event type and country to refresh packages and local contact numbers.</p>
            <div class="selectors-grid">
              <div class="field">
                <label for="event-type">Event type</label>
                <div class="select-wrap">
                  <select
                    id="event-type"
                    class="inp-select"
                    [(ngModel)]="selectedEventSlug"
                    (change)="navigateToSelection()"
                  >
                    @for (opt of eventTypeOptions; track opt.slug) {
                      <option [value]="opt.slug">{{ opt.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="field">
                <label for="country">Country</label>
                <div class="select-wrap">
                  <select id="country" class="inp-select" [(ngModel)]="selectedCountry" (change)="navigateToSelection()">
                    <option value="srilanka">Sri Lanka</option>
                    <option value="unitedkingdom">United Kingdom</option>
                    <option value="canada">Canada</option>
                    <option value="unitedstates">United States</option>
                    <option value ="australia">Australia</option>
                    <option value="germany">Germany</option>


                    
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section class="lift-card region-strip">
            <div class="region-pill">
              <span class="region-name">{{ pricing()!.countryDisplayName }}</span>
              <span class="region-badge">Open 24/7</span>
            </div>
            <div class="local-numbers">
              @for (num of pricing()!.localNumbers; track num) {
                <a class="local-num" [href]="'tel:' + telHref(num)">{{ num }}</a>
              }
            </div>
          </section>

          <section class="lift-card pricing-panel">
            <div class="panel-head">
              <h2 class="panel-title">{{ labelForPricingSlug(pricing()!.category) }} packages</h2>
              <p class="panel-meta">All amounts in <strong>{{ pricing()!.currencyCode }}</strong></p>
            </div>
            <div class="table-scroll">
              <table class="matrix">
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    @for (day of pricing()!.packageDays; track day; let idx = $index) {
                      <th scope="col" [class.is-rec]="idx === pricing()!.recommendedIndex">
                        @if (idx === pricing()!.recommendedIndex) {
                          <span class="col-badge">Popular</span>
                        }
                        <span class="col-label">{{ day }}</span>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of pricing()!.matrix; track row.feature) {
                    <tr>
                      <th scope="row">{{ row.feature }}</th>
                      @for (val of row.values; track idx; let idx = $index) {
                        <td [class.is-rec]="idx === pricing()!.recommendedIndex">{{ val }}</td>
                      }
                    </tr>
                  }
                  <tr class="order-row">
                    <td></td>
                    @for (day of pricing()!.packageDays; track day + '_order'; let idx = $index) {
                      <td [class.is-rec]="idx === pricing()!.recommendedIndex">
                        <button type="button" class="order-btn" (click)="openPaymentChoice(idx)">Order</button>
                      </td>
                    }
                  </tr>
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

      @if (showPaymentChoice()) {
        <div class="po-modal-root" role="dialog" aria-modal="true" aria-labelledby="po-pay-choice-title">
          <button type="button" class="po-modal-backdrop" (click)="closePaymentChoice()" aria-label="Close dialog"></button>
          <div class="po-modal-panel" (click)="$event.stopPropagation()">
            <button type="button" class="po-modal-x" (click)="closePaymentChoice()" aria-label="Close">✕</button>
            <div class="po-modal-accent" aria-hidden="true"></div>
            <div class="po-modal-head">
              <p class="po-modal-kicker">Secure checkout</p>
              <h2 id="po-pay-choice-title" class="po-modal-title">How would you like to pay?</h2>
              <p class="po-modal-lede">
                Pick the option that works best for you. You’ll get a reference after confirmation (direct) or after a
                successful card payment (Stripe).
              </p>
            </div>
            <div class="po-choice-actions">
              <button type="button" class="po-choice-btn po-choice-direct" (click)="choosePayment('direct')">
                <span class="po-choice-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="12" width="36" height="26" rx="3" stroke="currentColor" stroke-width="2" />
                    <path d="M6 20h36" stroke="currentColor" stroke-width="2" />
                    <path d="M14 30h8M26 30h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </span>
                <span class="po-choice-body">
                  <span class="po-choice-label">Direct payment</span>
                  <span class="po-choice-sub">Bank transfer or receipt — instant reference when you confirm</span>
                </span>
                <span class="po-choice-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </button>
              <button type="button" class="po-choice-btn po-choice-card" (click)="choosePayment('card')">
                <span class="po-choice-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="14" width="36" height="22" rx="3" stroke="currentColor" stroke-width="2" />
                    <path d="M6 22h36" stroke="currentColor" stroke-width="2" />
                    <rect x="10" y="28" width="14" height="4" rx="1" fill="currentColor" opacity="0.35" />
                  </svg>
                </span>
                <span class="po-choice-body">
                  <span class="po-choice-label">Card payment</span>
                  <span class="po-choice-sub">Stripe Checkout — Visa, Mastercard & more. Reference after payment</span>
                </span>
                <span class="po-choice-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </button>
            </div>
            <div class="po-modal-foot">
              <button type="button" class="po-modal-cancel" (click)="closePaymentChoice()">Not now</button>
            </div>
          </div>
        </div>
      }
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
      max-width: 1040px;
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
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.45;
      color: #5a6f68;
      max-width: 46ch;
      margin-inline: auto;
    }

    .selectors-card {
      padding: 1.25rem 1.35rem 1.35rem;
    }
    .card-heading {
      margin: 0 0 0.35rem;
      font-family: var(--font-display);
      font-size: 1.22rem;
      font-weight: 700;
      color: #0f2922;
    }
    .card-sub {
      margin: 0 0 1rem;
      font-size: 0.86rem;
      line-height: 1.45;
      color: #5a6f68;
    }
    .selectors-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .field label {
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #46675f;
    }
    .select-wrap {
      position: relative;
    }
    .select-wrap::after {
      content: '▾';
      position: absolute;
      right: 0.9rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.65rem;
      color: #1a5f4a;
      pointer-events: none;
    }
    .inp-select {
      width: 100%;
      appearance: none;
      padding: 0.72rem 2.25rem 0.72rem 0.85rem;
      border: 1px solid #d0e0d8;
      border-radius: 12px;
      font: inherit;
      font-size: 0.92rem;
      font-weight: 600;
      color: #0f2922;
      background: #f8fcfa;
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .inp-select:hover {
      border-color: #9fc9b8;
      background: #fff;
    }
    .inp-select:focus {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.15);
    }

    .region-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1rem 1.25rem;
    }
    .region-pill {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      flex-wrap: wrap;
    }
    .region-name {
      font-family: var(--font-display);
      font-size: 1.08rem;
      font-weight: 700;
      color: #0f2922;
    }
    .region-badge {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.28rem 0.55rem;
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(212, 165, 116, 0.22) 0%, rgba(232, 201, 168, 0.35) 100%);
      color: #5c4a32;
      border: 1px solid rgba(212, 165, 116, 0.35);
    }
    .local-numbers {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
      justify-content: flex-end;
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
    .pricing-panel:hover {
      transform: translateY(-3px);
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
      -webkit-overflow-scrolling: touch;
    }
    .matrix {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 720px;
    }
    .matrix th,
    .matrix td {
      padding: 0.62rem 0.75rem;
      text-align: center;
      font-size: 0.82rem;
      border-bottom: 1px solid rgba(26, 95, 74, 0.08);
      vertical-align: middle;
    }
    .matrix thead th {
      background: rgba(248, 252, 250, 0.95);
      font-weight: 700;
      color: #0f2922;
      border-bottom: 1px solid rgba(26, 95, 74, 0.12);
    }
    .matrix thead th:first-child {
      text-align: left;
      border-radius: 0;
      width: 26%;
    }
    .matrix tbody th[scope='row'] {
      text-align: left;
      font-weight: 600;
      color: #2c3d38;
      background: #fff;
    }
    .matrix .order-row td:first-child {
      border-bottom: none;
    }
    .col-badge {
      display: block;
      font-size: 0.58rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8a6a3a;
      margin-bottom: 0.28rem;
    }
    .col-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: inherit;
    }
    thead th.is-rec {
      background: linear-gradient(180deg, rgba(236, 246, 241, 0.95) 0%, rgba(248, 252, 250, 0.98) 100%);
      box-shadow: inset 0 0 0 1px rgba(26, 95, 74, 0.14);
      color: #0d3d32;
    }
    tbody td.is-rec {
      background: rgba(236, 246, 241, 0.55);
      box-shadow: inset 0 0 0 1px rgba(26, 95, 74, 0.06);
      font-weight: 600;
    }
    .order-row td {
      padding-top: 0.85rem;
      padding-bottom: 1.1rem;
      border-bottom: none;
    }
    .order-btn {
      border: none;
      border-radius: 10px;
      padding: 0.42rem 1rem;
      cursor: pointer;
      font: inherit;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #fff;
      background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 55%, #2d8f73 100%);
      box-shadow: 0 4px 14px rgba(13, 61, 50, 0.22);
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
    }
    .order-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(13, 61, 50, 0.28);
      filter: brightness(1.03);
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

    @media (max-width: 760px) {
      .selectors-grid {
        grid-template-columns: 1fr;
      }
      .region-strip {
        flex-direction: column;
        align-items: stretch;
      }
      .local-numbers {
        justify-content: flex-start;
      }
      .matrix {
        min-width: 640px;
      }
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
      .order-btn:hover {
        transform: none;
      }
    }

    .po-modal-root {
      position: fixed;
      inset: 0;
      z-index: 85;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      font-family: var(--font-body, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif);
    }
    .po-modal-backdrop {
      position: absolute;
      inset: 0;
      border: none;
      padding: 0;
      margin: 0;
      cursor: pointer;
      background: linear-gradient(165deg, rgba(10, 38, 32, 0.72) 0%, rgba(15, 52, 44, 0.55) 50%, rgba(8, 28, 24, 0.78) 100%);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .po-modal-panel {
      position: relative;
      z-index: 1;
      max-width: 460px;
      width: 100%;
      margin: 0;
      padding: 1.65rem 1.5rem 1.35rem;
      border-radius: 20px;
      background: linear-gradient(180deg, #ffffff 0%, #f9fdfb 55%, #f4faf7 100%);
      border: 1px solid rgba(26, 95, 74, 0.12);
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.65) inset,
        0 4px 6px rgba(13, 61, 50, 0.04),
        0 24px 56px rgba(13, 61, 50, 0.18),
        0 48px 96px rgba(13, 61, 50, 0.08);
      animation: poModalIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes poModalIn {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .po-modal-accent {
      position: absolute;
      top: 0;
      left: 1.25rem;
      right: 1.25rem;
      height: 4px;
      border-radius: 0 0 8px 8px;
      background: linear-gradient(90deg, #0d3d32, #2f7e66, #c9a227);
      opacity: 0.92;
    }
    .po-modal-x {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      border-radius: 10px;
      background: rgba(26, 95, 74, 0.08);
      color: #35584f;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
      z-index: 2;
    }
    .po-modal-x:hover {
      background: rgba(26, 95, 74, 0.14);
      color: #0d3d32;
    }
    .po-modal-x:focus-visible {
      outline: 2px solid #1a5f4a;
      outline-offset: 2px;
    }
    .po-modal-head {
      text-align: center;
      padding: 0.35rem 1.75rem 0.25rem 0.25rem;
      margin-bottom: 1.15rem;
    }
    .po-modal-kicker {
      margin: 0 0 0.4rem;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #2f7e66;
    }
    .po-modal-title {
      margin: 0 0 0.5rem;
      font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
      font-size: clamp(1.2rem, 3.2vw, 1.45rem);
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.2;
      color: #0f2922;
    }
    .po-modal-lede {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
      color: #5a6f68;
      max-width: 38ch;
      margin-inline: auto;
    }
    .po-choice-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .po-choice-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      text-align: left;
      border-radius: 16px;
      border: 1.5px solid rgba(26, 95, 74, 0.14);
      padding: 1rem 1rem 1rem 1.05rem;
      background: #fff;
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;
      box-shadow: 0 1px 2px rgba(13, 61, 50, 0.04);
    }
    .po-choice-btn:hover {
      border-color: rgba(26, 95, 74, 0.32);
      background: #fbfffc;
      box-shadow: 0 8px 24px rgba(13, 61, 50, 0.08);
      transform: translateY(-2px);
    }
    .po-choice-btn:focus-visible {
      outline: none;
      border-color: #1a5f4a;
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.18), 0 8px 24px rgba(13, 61, 50, 0.08);
    }
    .po-choice-btn:active {
      transform: translateY(0);
    }
    .po-choice-direct:hover {
      border-color: rgba(29, 78, 216, 0.35);
    }
    .po-choice-direct .po-choice-icon {
      color: #1d4ed8;
      background: linear-gradient(145deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04));
      border-color: rgba(59, 130, 246, 0.2);
    }
    .po-choice-card:hover {
      border-color: rgba(109, 40, 217, 0.35);
    }
    .po-choice-card .po-choice-icon {
      color: #6d28d9;
      background: linear-gradient(145deg, rgba(139, 92, 246, 0.14), rgba(139, 92, 246, 0.04));
      border-color: rgba(139, 92, 246, 0.22);
    }
    .po-choice-icon {
      flex-shrink: 0;
      width: 3.25rem;
      height: 3.25rem;
      display: grid;
      place-items: center;
      border-radius: 14px;
      border: 1px solid transparent;
    }
    .po-choice-icon svg {
      width: 1.85rem;
      height: 1.85rem;
    }
    .po-choice-body {
      flex: 1;
      min-width: 0;
    }
    .po-choice-label {
      display: block;
      font-weight: 800;
      font-size: 0.95rem;
      letter-spacing: -0.01em;
      color: #0f2922;
    }
    .po-choice-sub {
      display: block;
      margin-top: 0.28rem;
      font-size: 0.8rem;
      line-height: 1.48;
      color: #5a6f68;
    }
    .po-choice-arrow {
      flex-shrink: 0;
      width: 2rem;
      height: 2rem;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: rgba(26, 95, 74, 0.08);
      color: #1a5f4a;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .po-choice-arrow svg {
      width: 1.1rem;
      height: 1.1rem;
    }
    .po-choice-btn:hover .po-choice-arrow {
      background: rgba(26, 95, 74, 0.14);
      transform: translateX(2px);
    }
    .po-modal-foot {
      margin-top: 1.15rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(26, 95, 74, 0.1);
      display: flex;
      justify-content: center;
    }
    .po-modal-cancel {
      border: 1px solid rgba(26, 95, 74, 0.18);
      background: transparent;
      font-size: 0.82rem;
      font-weight: 700;
      color: #46675f;
      cursor: pointer;
      padding: 0.55rem 1.35rem;
      border-radius: 999px;
      transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
    }
    .po-modal-cancel:hover {
      border-color: rgba(26, 95, 74, 0.3);
      background: rgba(248, 252, 250, 0.9);
      color: #0d3d32;
    }
    .po-modal-cancel:focus-visible {
      outline: 2px solid #1a5f4a;
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      .po-modal-panel {
        animation: none;
      }
      .po-choice-btn:hover {
        transform: none;
      }
      .po-choice-btn:hover .po-choice-arrow {
        transform: none;
      }
    }
  `]
})
export class PricingObituaryComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  pricing = signal<PricingPageDto | null>(null);

  showPaymentChoice = signal(false);
  choicePackageIndex = signal<number | null>(null);

  readonly eventTypeOptions = MEMORA_EVENT_TYPES;
  readonly labelForPricingSlug = labelForPricingSlug;

  selectedEventSlug = 'obituary';
  selectedCountry = 'srilanka';

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly authUi: AuthUiService
  ) {
    effect(() => {
      const idx = this.authUi.pendingPricingPackageIndex();
      const loggedIn = this.auth.isLoggedIn();
      if (!loggedIn || idx === null) return;
      untracked(() => {
        this.choicePackageIndex.set(idx);
        this.showPaymentChoice.set(true);
        this.authUi.clearPendingPricingPackage();
      });
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const rawCat = params.get('category');
      const normalized = normalizePricingSlugFromRoute(rawCat);
      this.selectedEventSlug = normalized;
      this.selectedCountry = (params.get('country') || 'srilanka').toLowerCase();
      const rawSlug = (rawCat?.trim() || 'obituary').toLowerCase().replace(/_/g, '-');
      if (rawSlug !== normalized) {
        void this.router.navigate(['/pricing', normalized, this.selectedCountry], { replaceUrl: true });
      }
      this.loadPricing();
    });
  }

  navigateToSelection(): void {
    void this.router.navigate(['/pricing', this.selectedEventSlug, this.selectedCountry]);
  }

  /** Normalize phone string for tel: href */
  telHref(phone: string): string {
    const trimmed = phone.trim();
    const digits = trimmed.replace(/[^\d]/g, '');
    return digits || trimmed;
  }

  openPaymentChoice(packageColumnIndex: number): void {
    this.choicePackageIndex.set(packageColumnIndex);
    this.showPaymentChoice.set(true);
  }

  closePaymentChoice(): void {
    this.showPaymentChoice.set(false);
    this.choicePackageIndex.set(null);
  }

  choosePayment(kind: 'direct' | 'card'): void {
    if (!this.auth.isLoggedIn()) {
      this.closePaymentChoice();
      this.authUi.openLogin();
      return;
    }
    const idx = this.choicePackageIndex();
    if (idx === null) {
      return;
    }
    this.closePaymentChoice();
    void this.router.navigate(['/pricing', 'order'], {
      queryParams: {
        category: this.selectedEventSlug,
        country: this.selectedCountry,
        pkg: idx,
        mode: kind
      }
    });
  }

  /** Small illustrated badge next to each payment method label (see `src/assets/payments/`). */
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
    this.api.getPricingPage(this.selectedEventSlug, this.selectedCountry).subscribe({
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
