import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatUsd } from '../../constants/display-plans';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-my-event-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="pay-page">
      <div class="container pay-shell">
        <div class="page-back-bar page-back-bar--flush">
          <a routerLink="/my-events" class="page-back">← {{ 'nav.back' | t }}</a>
        </div>
      <h1>{{ 'myEvents.cardFormTitle' | t }}</h1>
      <p class="lede">{{ 'myEvents.cardFormLede' | t }}</p>

      <div class="summary">
        <div class="row"><span>Duration</span><strong>{{ label() }}</strong></div>
        <div class="row total"><span>Total</span><strong>{{ usd(price()) }} USD</strong></div>
      </div>

      @if (error()) {
        <p class="err" role="alert">{{ error() }}</p>
      }

      <div class="instructions" role="note">
        <h2 class="instructions-title">{{ 'myEvents.paymentHowItWorks' | t }}</h2>
        <ul class="instructions-list">
          <li>{{ 'myEvents.paymentInstrCard' | t }}</li>
          <li>{{ 'myEvents.paymentInstrAlt' | t }}</li>
        </ul>
      </div>

      <div class="stripe-panel">
        <p class="stripe-note">{{ 'myEvents.stripeSecureNote' | t }}</p>
        <button type="button" class="pay-btn" (click)="payWithStripe()" [disabled]="busy() || !draftId">
          @if (busy()) {
            <span class="btn-spinner" aria-hidden="true"></span>
            {{ 'myEvents.redirectingStripe' | t }}
          } @else {
            {{ 'myEvents.payWithStripe' | t }}
          }
        </button>
        <p class="stripe-test-hint">{{ 'myEvents.stripeTestHint' | t }}</p>
      </div>
      </div>
    </div>
  `,
  styles: [
    `
      .pay-page { padding: 0 0 2.5rem; }
      .pay-shell { max-width: 520px; padding: 0 1rem 0; }
      h1 { margin: 0.35rem 0 0.35rem; font-family: var(--font-display); color: #0f2922; }
      .lede { color: #5a6f68; font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.5; }
      .instructions {
        background: #f0f9f5;
        border: 1px solid rgba(26, 95, 74, 0.14);
        border-radius: 12px;
        padding: 1rem 1.1rem;
        margin-bottom: 1rem;
      }
      .instructions-title {
        margin: 0 0 0.6rem;
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #0d3d32;
      }
      .instructions-list {
        margin: 0;
        padding-left: 1.15rem;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        font-size: 0.84rem;
        line-height: 1.5;
        color: #3d524c;
      }
      .summary {
        background: #f8fcfa;
        border: 1px solid rgba(26, 95, 74, 0.12);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      .summary .row { display: flex; justify-content: space-between; margin-bottom: 0.35rem; font-size: 0.9rem; }
      .summary .total { font-weight: 700; color: #0d3d32; margin-bottom: 0; }
      .err { color: #b91c1c; margin-bottom: 0.75rem; }

      .stripe-panel {
        background: #fff;
        border: 1px solid rgba(26, 95, 74, 0.12);
        border-radius: 16px;
        padding: 1.15rem;
      }
      .stripe-note {
        margin: 0 0 1rem;
        font-size: 0.86rem;
        line-height: 1.5;
        color: #46675f;
      }
      .stripe-test-hint {
        margin: 0.75rem 0 0;
        font-size: 0.78rem;
        color: #6b7f78;
        line-height: 1.45;
      }
      .pay-btn {
        width: 100%;
        border: none;
        border-radius: 12px;
        padding: 0.88rem 1.1rem;
        font: inherit;
        font-weight: 800;
        color: #fff;
        background: linear-gradient(135deg, #0d3d32, #1a5f4a);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
      .pay-btn:disabled { opacity: 0.65; cursor: not-allowed; }
      .btn-spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `
  ]
})
export class MyEventPaymentComponent implements OnInit {
  draftId = 0;
  label = signal('');
  price = signal(0);
  busy = signal(false);
  error = signal('');

  readonly usd = formatUsd;
  private readonly i18n = inject(LanguageService);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.draftId = Number(this.route.snapshot.paramMap.get('draftId'));
    this.label.set(this.route.snapshot.queryParamMap.get('label') || 'Display plan');
    this.price.set(Number(this.route.snapshot.queryParamMap.get('price')) || 0);
    if (!this.draftId) {
      this.error.set('Invalid payment link.');
    }
  }

  payWithStripe(): void {
    if (!this.draftId) return;

    this.busy.set(true);
    this.error.set('');
    this.api.createCheckoutSession(this.draftId).subscribe({
      next: (res) => {
        this.busy.set(false);
        if (!res.url) {
          this.error.set(this.i18n.t('myEvents.stripeUrlMissing'));
          return;
        }
        window.location.href = res.url;
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err.error?.message || this.i18n.t('myEvents.cardPayFailed'));
      }
    });
  }
}
