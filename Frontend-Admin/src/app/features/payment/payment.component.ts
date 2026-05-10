

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="payment-hero">
      <div class="container">
        <h1>Complete Payment</h1>
        <p>Your event will be displayed for the selected duration after payment.</p>
      </div>
    </section>

    <div class="container payment-container">
      <div class="payment-card">

        <!-- ORDER SUMMARY -->
        <h2>Order Summary</h2>
        <div class="summary-row">
          <span>Display duration</span>
          <strong>{{ label() }}</strong>
        </div>
        <div class="summary-row">
          <span>Currency</span>
          <strong>{{ currencySymbol() }} {{ currencyCode() }}</strong>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <strong>{{ currencySymbol() }}{{ convertedPrice() }}</strong>
        </div>

        <!-- ATM CARD PAYMENT FORM -->
        <div class="card-form-section">
          <h3 class="card-form-title">
            <span class="card-icon">💳</span> Card Details
          </h3>

          <!-- Card Visual -->
          <div class="card-visual" [class.flipped]="showBack">
            <div class="card-front">
              <div class="card-chip"></div>
              <div class="card-number-display">
                {{ formattedCardDisplay() }}
              </div>
              <div class="card-bottom">
                <div class="card-holder">
                  <span class="card-label">Card Holder</span>
                  <span class="card-value">{{ cardName || 'YOUR NAME' }}</span>
                </div>
                <div class="card-expiry">
                  <span class="card-label">Expires</span>
                  <span class="card-value">{{ expiryDisplay }}</span>
                </div>
              </div>
            </div>
            <div class="card-back">
              <div class="card-stripe"></div>
              <div class="card-cvv-row">
                <span class="card-label">CVV</span>
                <div class="cvv-box">{{ cvv || '•••' }}</div>
              </div>
            </div>
          </div>

          <!-- Name on Card -->
          <div class="form-group">
            <label for="cardName">Name on Card</label>
            <input
              id="cardName"
              type="text"
              class="form-control"
              placeholder="e.g. John Smith"
              [(ngModel)]="cardName"
              maxlength="26"
              autocomplete="cc-name"
            />
          </div>

          <!-- 16-Digit Card Number -->
          <div class="form-group">
            <label for="cardNumber">Card Number (16 digits)</label>
            <div class="card-number-input-wrap">
              <input
                id="cardNumber"
                type="text"
                class="form-control"
                placeholder="0000 0000 0000 0000"
                [value]="formattedCardNumber"
                (input)="onCardNumberInput($event)"
                maxlength="19"
                inputmode="numeric"
                autocomplete="cc-number"
              />
              <span class="card-brand-icon">{{ cardBrandIcon() }}</span>
            </div>
          </div>

          <!-- Expiry + CVV -->
          <div class="form-row">
            <div class="form-group">
              <label for="expiry">Expiry Date</label>
              <input
                id="expiry"
                type="text"
                class="form-control"
                placeholder="MM/YY"
                [value]="expiryDisplay"
                (input)="onExpiryInput($event)"
                maxlength="5"
                inputmode="numeric"
                autocomplete="cc-exp"
              />
            </div>
            <div class="form-group">
              <label for="cvv">CVV (3 digits)</label>
              <input
                id="cvv"
                type="text"
                class="form-control"
                placeholder="•••"
                [(ngModel)]="cvv"
                (focus)="showBack = true"
                (blur)="showBack = false"
                maxlength="3"
                inputmode="numeric"
                autocomplete="cc-csc"
              />
            </div>
          </div>
        </div>
        <!-- END CARD FORM -->

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        @if (fieldError()) {
          <div class="error-msg">{{ fieldError() }}</div>
        }

        <div class="payment-actions">
          <button
            class="btn btn-primary btn-lg"
            (click)="payNow()"
            [disabled]="paying()"
          >
            {{ paying() ? 'Processing...' : 'Pay ' + currencySymbol() + convertedPrice() }}
          </button>
          <a routerLink="/create-event" class="btn btn-outline">Cancel</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Hero ── */
    .payment-hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .payment-hero h1 { color: white; margin-bottom: 0.5rem; }
    .payment-hero p  { opacity: 0.9; margin: 0; }

    /* ── Layout ── */
    .payment-container { max-width: 520px; margin: 0 auto; padding: 2rem 1.5rem; }
    .payment-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .payment-card h2 { margin: 0 0 1.5rem; font-size: 1.25rem; }

    /* ── Summary rows ── */
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
    }
    .summary-row.total {
      font-size: 1.25rem;
      border-bottom: none;
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 2px solid var(--primary);
    }

    /* ── Card form section ── */
    .card-form-section {
      margin-top: 2rem;
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
    }
    .card-form-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* ── Animated Card Visual ── */
    .card-visual {
      width: 100%;
      height: 180px;
      perspective: 1000px;
      margin-bottom: 1.5rem;
      position: relative;
    }
    .card-front, .card-back {
      position: absolute;
      inset: 0;
      border-radius: 14px;
      backface-visibility: hidden;
      transition: transform 0.6s ease;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-front {
      background: linear-gradient(135deg, #1a5c38 0%, #2d9b6a 100%);
      color: white;
      transform: rotateY(0deg);
    }
    .card-back {
      background: linear-gradient(135deg, #2c2c2c 0%, #555 100%);
      color: white;
      transform: rotateY(180deg);
      justify-content: flex-start;
      gap: 1rem;
    }
    .card-visual.flipped .card-front { transform: rotateY(-180deg); }
    .card-visual.flipped .card-back  { transform: rotateY(0deg); }

    .card-chip {
      width: 40px; height: 30px;
      background: linear-gradient(135deg, #ffd700, #ffb300);
      border-radius: 5px;
      border: 1px solid rgba(0,0,0,0.2);
    }
    .card-number-display {
      font-size: 1.1rem;
      letter-spacing: 0.2em;
      font-family: 'Courier New', monospace;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .card-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
    .card-holder, .card-expiry { display: flex; flex-direction: column; }
    .card-label { font-size: 0.65rem; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.1em; }
    .card-value { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

    .card-stripe {
      height: 40px;
      background: #1a1a1a;
      margin: 0 -1.25rem;
    }
    .card-cvv-row {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    .cvv-box {
      background: white;
      color: #333;
      padding: 0.35rem 1rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.2em;
      font-size: 1rem;
    }

    /* ── Form fields ── */
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.4rem;
    }
    .form-control {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1.5px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
      outline: none;
    }
    .form-control:focus { border-color: var(--primary); }

    .card-number-input-wrap { position: relative; }
    .card-brand-icon {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.25rem;
    }
    .card-number-input-wrap .form-control { padding-right: 2.5rem; }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* ── Errors ── */
    .error-msg {
      background: #fef2f2;
      color: #c53030;
      padding: 1rem;
      border-radius: var(--radius);
      margin: 1rem 0;
      font-size: 0.9rem;
    }

    /* ── Actions ── */
    .payment-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }
    .payment-actions .btn { flex: 1; }
  `]
})
export class PaymentComponent {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private api    = inject(ApiService);
  private stats  = inject(EventStatsService);

  // ── Route params ──────────────────────────────────────────
  draftId = 0;
  label   = signal('');
  price   = signal(0);   // base price in USD
  paying  = signal(false);
  error   = signal('');
  fieldError = signal('');

  // ── Currency (from query params passed by create-event) ──
  currencyCode   = signal('USD');
  currencySymbol = signal('$');
  exchangeRate   = signal(1);   // rate: 1 USD = X local

  // ── Card form ─────────────────────────────────────────────
  cardName   = '';
  cardNumber = '';          // raw 16 digits
  cvv        = '';
  expiryDisplay  = '';
  showBack   = false;

  // ── Currency map ─────────────────────────────────────────
  /** Extend this map with as many countries/currencies as you need.
   *  The keys match whatever value your create-event page passes as &currency= */
  private readonly CURRENCY_MAP: Record<string, { symbol: string; code: string }> = {
    USD: { symbol: '$',   code: 'USD' },
    GBP: { symbol: '£',   code: 'GBP' },
    EUR: { symbol: '€',   code: 'EUR' },
    LKR: { symbol: 'Rs',  code: 'LKR' },
    INR: { symbol: '₹',   code: 'INR' },
    AUD: { symbol: 'A$',  code: 'AUD' },
    CAD: { symbol: 'C$',  code: 'CAD' },
    JPY: { symbol: '¥',   code: 'JPY' },
    CNY: { symbol: '¥',   code: 'CNY' },
    SGD: { symbol: 'S$',  code: 'SGD' },
    MYR: { symbol: 'RM',  code: 'MYR' },
    AED: { symbol: 'د.إ', code: 'AED' },
    SAR: { symbol: '﷼',   code: 'SAR' },
    NZD: { symbol: 'NZ$', code: 'NZD' },
    ZAR: { symbol: 'R',   code: 'ZAR' },
    BDT: { symbol: '৳',   code: 'BDT' },
    PKR: { symbol: '₨',   code: 'PKR' },
    NGN: { symbol: '₦',   code: 'NGN' },
    BRL: { symbol: 'R$',  code: 'BRL' },
    MXN: { symbol: 'MX$', code: 'MXN' },
  };

  constructor() {
    const snap = this.route.snapshot;
    const id   = snap.paramMap.get('draftId');
    this.draftId = id ? parseInt(id, 10) : 0;

    const days  = snap.queryParamMap.get('days');
    const p     = snap.queryParamMap.get('price');
    const lbl   = snap.queryParamMap.get('label');
    const cur   = snap.queryParamMap.get('currency') || 'USD';
    const sym   = snap.queryParamMap.get('symbol')   || '$';
    const rate  = snap.queryParamMap.get('rate')     || '1';

    this.label.set(lbl || (days ? `${days} days` : ''));
    this.price.set(p ? parseFloat(p) : 0);

    // Resolve currency code + symbol from map, fallback to query params
    const mapped = this.CURRENCY_MAP[cur.toUpperCase()];
    this.currencyCode.set(mapped?.code   ?? cur.toUpperCase());
    this.currencySymbol.set(mapped?.symbol ?? sym);
    this.exchangeRate.set(parseFloat(rate) || 1);
  }

  // ── Computed converted price ──────────────────────────────
  convertedPrice(): string {
    const raw = this.price() * this.exchangeRate();
    // JPY, KRW, etc. have no decimal places
    const noDecimal = ['JPY', 'KRW', 'VND', 'IDR'];
    return noDecimal.includes(this.currencyCode())
      ? Math.round(raw).toString()
      : raw.toFixed(2);
  }

  // ── Card number formatting ────────────────────────────────
  get formattedCardNumber(): string {
    return this.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  formattedCardDisplay(): string {
    const raw = this.cardNumber.padEnd(16, '•');
    return raw.replace(/(.{4})/g, '$1 ').trim();
  }

  cardBrandIcon(): string {
    if (!this.cardNumber) return '💳';
    if (this.cardNumber.startsWith('4'))           return '💙'; // Visa
    if (/^5[1-5]/.test(this.cardNumber))           return '🟠'; // Mastercard
    if (/^3[47]/.test(this.cardNumber))            return '🟢'; // Amex
    if (this.cardNumber.startsWith('6'))           return '🟣'; // Discover/RuPay
    return '💳';
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // strip spaces and non-digits, keep max 16
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber = digits;
    // update input display value
    input.value = this.formattedCardNumber;
  }

  onExpiryInput(event: Event): void {
    const input  = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    this.expiryDisplay = raw;
    input.value = raw;
  }

  // ── Validation ───────────────────────────────────────────
  private validateCard(): boolean {
    this.fieldError.set('');
    if (!this.cardName.trim()) {
      this.fieldError.set('Please enter the name on your card.'); return false;
    }
    if (this.cardNumber.length !== 16) {
      this.fieldError.set('Please enter a valid 16-digit card number.'); return false;
    }
    const [mm] = this.expiryDisplay.split('/');
    if (this.expiryDisplay.length < 5 || parseInt(mm, 10) < 1 || parseInt(mm, 10) > 12) {
      this.fieldError.set('Please enter a valid expiry date (MM/YY).'); return false;
    }
    if (this.cvv.length !== 3) {
      this.fieldError.set('Please enter a valid 3-digit CVV.'); return false;
    }
    return true;
  }

  /** Maps HTTP/API errors to a message users can act on (many responses omit a body). */
  private extractApiError(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) return err instanceof Error ? err.message : '';

    const status = err.status;
    const body = err.error;

    if (typeof body === 'string' && body.trim()) {
      try {
        const parsed = JSON.parse(body) as { message?: string };
        if (parsed?.message) return parsed.message;
      } catch {
        return body;
      }
    }

    if (body && typeof body === 'object') {
      const o = body as { message?: string; title?: string; detail?: string };
      if (typeof o.message === 'string' && o.message.trim()) return o.message;
      if (typeof o.detail === 'string' && o.detail.trim()) return o.detail;
      if (typeof o.title === 'string' && o.title.trim()) {
        return o.detail ? `${o.title}: ${o.detail}` : o.title;
      }
    }

    if (status === 401) return 'Your session expired. Please log in again and return to this page.';
    if (status === 403) {
      return 'You are not allowed to pay for this draft. Create the event again while logged in as the same account.';
    }
    if (status === 404) return 'This draft was not found or has already been used. Create a new event from Event management.';
    if (status === 0) return 'Cannot reach the server. Check that the API is running and try again.';
    return '';
  }

  private shouldStripeFallbackToMock(message: string): boolean {
    const m = message.toLowerCase();
    return m.includes('not configured') || m.includes('stripe:secretkey');
  }

  // ── Payment ──────────────────────────────────────────────
  payNow() {
    if (!this.draftId || this.draftId <= 0) {
      this.error.set('Invalid draft. Please go back and create the event again.');
      return;
    }
    if (!this.validateCard()) return;

    this.paying.set(true);
    this.error.set('');
    this.api.createCheckoutSession(this.draftId).subscribe({
      next: (res) => {
        this.paying.set(false);
        if (res.url) {
          window.location.href = res.url;
        } else {
          this.error.set('No payment URL received.');
        }
      },
      error: (err) => {
        console.error('Checkout error:', err);
        const msg = this.extractApiError(err);
        if (this.shouldStripeFallbackToMock(msg)) {
          this.payWithMock();
          return;
        }
        this.error.set(msg || 'Payment failed. Please try again.');
        this.paying.set(false);
      }
    });
  }

  payWithMock() {
    if (!this.draftId || this.draftId <= 0) return;
    this.paying.set(true);
    this.error.set('');
    this.api.confirmPaymentMock(this.draftId).subscribe({
      next: (ev: { id: number }) => {
        this.stats.loadFromApi();
        this.paying.set(false);
        window.location.href = `${environment.customerPortalUrl}/event/${ev.id}`;
      },
      error: (err) => {
        this.error.set(this.extractApiError(err) || 'Payment failed. Please try again.');
        this.paying.set(false);
      }
    });
  }
}