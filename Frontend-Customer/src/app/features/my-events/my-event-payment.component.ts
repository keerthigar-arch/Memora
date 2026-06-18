import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { formatUsd } from '../../constants/display-plans';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-my-event-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="pay-page container">
      <a routerLink="/my-events" class="back">← {{ 'myEvents.back' | t }}</a>
      <h1>{{ 'myEvents.paymentTitle' | t }}</h1>
      <p class="lede">{{ 'myEvents.paymentLede' | t }}</p>

      <div class="instructions" role="note">
        <h2 class="instructions-title">{{ 'myEvents.paymentHowItWorks' | t }}</h2>
        <ul class="instructions-list">
          <li>{{ 'myEvents.paymentInstrCard' | t }}</li>
          <li>{{ 'myEvents.paymentInstrOffline' | t }}</li>
          <li>{{ 'myEvents.paymentInstrAlt' | t }}</li>
        </ul>
      </div>

      <div class="summary">
        <div class="row"><span>Duration</span><strong>{{ label() }}</strong></div>
        <div class="row total"><span>Total</span><strong>{{ usd(price()) }} USD</strong></div>
      </div>

      @if (message()) {
        <p class="ok" role="status">{{ message() }}</p>
      }
      @if (error()) {
        <p class="err" role="alert">{{ error() }}</p>
      }

      <div class="choices">
        <button type="button" class="choice card-pay" (click)="payCard()" [disabled]="busy()">
          <span class="choice-title">{{ 'myEvents.cardPay' | t }}</span>
          <span class="choice-sub">{{ 'myEvents.cardPaySub' | t }}</span>
        </button>
        <button type="button" class="choice offline-pay" (click)="payOffline()" [disabled]="busy()">
          <span class="choice-title">{{ 'myEvents.offlinePay' | t }}</span>
          <span class="choice-sub">{{ 'myEvents.offlinePaySub' | t }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .pay-page { max-width: 520px; padding: 1.25rem 1rem 2.5rem; }
      .back { color: #1a5f4a; text-decoration: none; font-size: 0.88rem; }
      h1 { margin: 0.75rem 0 0.35rem; font-family: var(--font-display); }
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
      .summary .total { font-weight: 700; color: #0d3d32; }
      .choices { display: flex; flex-direction: column; gap: 0.75rem; }
      .choice {
        text-align: left;
        padding: 1rem 1.1rem;
        border-radius: 14px;
        border: 1.5px solid rgba(26, 95, 74, 0.18);
        background: #fff;
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .choice:disabled { opacity: 0.6; cursor: not-allowed; }
      .choice:not(:disabled):hover { border-color: #1a5f4a; box-shadow: 0 6px 20px rgba(13, 61, 50, 0.08); }
      .choice-title { display: block; font-weight: 800; color: #0f2922; }
      .choice-sub { display: block; margin-top: 0.25rem; font-size: 0.82rem; color: #5a6f68; }
      .ok { color: #166534; background: #f0fdf4; padding: 0.75rem; border-radius: 10px; }
      .err { color: #b91c1c; }
    `
  ]
})
export class MyEventPaymentComponent implements OnInit {
  draftId = 0;
  label = signal('');
  price = signal(0);
  busy = signal(false);
  error = signal('');
  message = signal('');

  readonly usd = formatUsd;
  private readonly i18n = inject(LanguageService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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

  payCard(): void {
    if (!this.draftId) return;
    this.busy.set(true);
    this.error.set('');
    this.api.createCheckoutSession(this.draftId).subscribe({
      next: (res) => {
        if (res.url) {
          window.location.href = res.url;
          return;
        }
        this.busy.set(false);
        this.error.set('No checkout URL returned.');
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || '';
        if (msg.toLowerCase().includes('stripe') && msg.toLowerCase().includes('not configured')) {
          this.tryMockCard();
          return;
        }
        this.busy.set(false);
        this.error.set(msg || 'Card payment could not start.');
      }
    });
  }

  private tryMockCard(): void {
    this.api.confirmPaymentMock(this.draftId).subscribe({
      next: (ev) => {
        this.busy.set(false);
        void this.router.navigate(['/event', ev.id]);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e.error?.message || 'Mock payment failed.');
      }
    });
  }

  payOffline(): void {
    if (!this.draftId) return;
    this.busy.set(true);
    this.error.set('');
    this.api.submitOfflinePayment(this.draftId).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set(this.i18n.t('myEvents.offlineSubmitSuccess'));
        setTimeout(() => void this.router.navigate(['/my-events']), 2000);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err.error?.message || 'Could not submit offline payment.');
      }
    });
  }
}
