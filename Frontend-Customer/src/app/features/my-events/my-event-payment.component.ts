import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { formatUsd } from '../../constants/display-plans';
import { ApiService, isAwaitingApprovalPaymentResult } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-my-event-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  template: `
    <div class="pay-page container">
      <a routerLink="/my-events" class="back">← {{ 'myEvents.back' | t }}</a>
      <h1>{{ 'myEvents.cardFormTitle' | t }}</h1>
      <p class="lede">{{ 'myEvents.cardFormLede' | t }}</p>

      <div class="summary">
        <div class="row"><span>Duration</span><strong>{{ label() }}</strong></div>
        <div class="row total"><span>Total</span><strong>{{ usd(price()) }} USD</strong></div>
      </div>

      @if (message()) {
        <p class="ok" role="status">{{ message() }}</p>
        @if (paymentReference()) {
          <div class="ref-box" role="status">
            <span class="ref-label">{{ 'myEvents.paymentReference' | t }}</span>
            <strong class="ref-code">{{ paymentReference() }}</strong>
            <p class="ref-hint">{{ 'myEvents.approvalEmailHint' | t }}</p>
          </div>
        }
      }
      @if (error()) {
        <p class="err" role="alert">{{ error() }}</p>
      }

      @if (!message()) {
        <div class="instructions" role="note">
          <h2 class="instructions-title">{{ 'myEvents.paymentHowItWorks' | t }}</h2>
          <ul class="instructions-list">
            <li>{{ 'myEvents.paymentInstrCard' | t }}</li>
            <li>{{ 'myEvents.paymentInstrAlt' | t }}</li>
          </ul>
        </div>

        <div class="card-panel">
          <div class="card-visual" [class.flipped]="showBack">
            <div class="card-front">
              <div class="card-chip"></div>
              <div class="card-number-display">{{ formattedCardDisplay() }}</div>
              <div class="card-bottom">
                <div>
                  <span class="card-label">Card holder</span>
                  <span class="card-value">{{ cardName || 'YOUR NAME' }}</span>
                </div>
                <div>
                  <span class="card-label">Expires</span>
                  <span class="card-value">{{ expiryDisplay || 'MM/YY' }}</span>
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

          <button type="button" class="sample-btn" (click)="fillSample()" [disabled]="busy()">
            {{ 'myEvents.fillSampleCard' | t }}
          </button>

          <div class="field">
            <label for="cardName">{{ 'myEvents.cardName' | t }}</label>
            <input
              id="cardName"
              type="text"
              [(ngModel)]="cardName"
              maxlength="26"
              autocomplete="cc-name"
              [placeholder]="'myEvents.cardNamePh' | t"
            />
            @if (fieldError() === 'name') {
              <p class="field-err">{{ 'myEvents.cardNameErr' | t }}</p>
            }
          </div>

          <div class="field">
            <label for="cardNumber">{{ 'myEvents.cardNumber' | t }}</label>
            <input
              id="cardNumber"
              type="text"
              [value]="formattedCardNumber"
              (input)="onCardNumberInput($event)"
              maxlength="19"
              inputmode="numeric"
              autocomplete="cc-number"
              placeholder="0000 0000 0000 0000"
            />
            @if (fieldError() === 'number') {
              <p class="field-err">{{ 'myEvents.cardNumberErr' | t }}</p>
            }
          </div>

          <div class="field-row">
            <div class="field">
              <label for="expiry">{{ 'myEvents.cardExpiry' | t }}</label>
              <input
                id="expiry"
                type="text"
                [value]="expiryDisplay"
                (input)="onExpiryInput($event)"
                maxlength="5"
                inputmode="numeric"
                autocomplete="cc-exp"
                placeholder="MM/YY"
              />
              @if (fieldError() === 'expiry') {
                <p class="field-err">{{ 'myEvents.cardExpiryErr' | t }}</p>
              }
            </div>
            <div class="field">
              <label for="cvv">{{ 'myEvents.cardCvv' | t }}</label>
              <input
                id="cvv"
                type="text"
                [(ngModel)]="cvv"
                (focus)="showBack = true"
                (blur)="showBack = false"
                maxlength="3"
                inputmode="numeric"
                autocomplete="cc-csc"
                placeholder="•••"
              />
              @if (fieldError() === 'cvv') {
                <p class="field-err">{{ 'myEvents.cardCvvErr' | t }}</p>
              }
            </div>
          </div>

          <div class="card-actions">
            <button type="button" class="pay-btn" (click)="payWithCard()" [disabled]="busy()">
              @if (busy()) {
                <span class="btn-spinner" aria-hidden="true"></span>
                {{ 'myEvents.paying' | t }}
              } @else {
                {{ 'myEvents.proceedPayment' | t }}
              }
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .pay-page { max-width: 520px; padding: 1.25rem 1rem 2.5rem; }
      .back { color: #1a5f4a; text-decoration: none; font-size: 0.88rem; }
      h1 { margin: 0.75rem 0 0.35rem; font-family: var(--font-display); color: #0f2922; }
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
      .ok { color: #166534; background: #f0fdf4; padding: 0.75rem; border-radius: 10px; }
      .ref-box {
        margin-top: 0.75rem;
        padding: 0.9rem 1rem;
        border-radius: 12px;
        border: 1px solid #d8e3de;
        background: #f5f7f6;
      }
      .ref-label {
        display: block;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #5a6f68;
        margin-bottom: 0.35rem;
      }
      .ref-code {
        display: block;
        font-family: ui-monospace, Consolas, Monaco, monospace;
        font-size: 1.05rem;
        color: #1e4638;
        letter-spacing: 0.02em;
      }
      .ref-hint {
        margin: 0.55rem 0 0;
        font-size: 0.8rem;
        color: #52635c;
      }
      .err { color: #b91c1c; margin-bottom: 0.75rem; }

      .card-panel {
        background: #fff;
        border: 1px solid rgba(26, 95, 74, 0.12);
        border-radius: 16px;
        padding: 1.15rem;
      }
      .card-visual {
        position: relative;
        height: 168px;
        margin-bottom: 1rem;
        perspective: 900px;
      }
      .card-front, .card-back {
        position: absolute;
        inset: 0;
        border-radius: 14px;
        padding: 1.1rem 1.2rem;
        color: #fff;
        backface-visibility: hidden;
        transition: transform 0.45s ease;
        background: linear-gradient(135deg, #0d3d32 0%, #1a5f4a 55%, #2f7e66 100%);
        box-shadow: 0 12px 28px rgba(13, 61, 50, 0.22);
      }
      .card-back { transform: rotateY(180deg); }
      .card-visual.flipped .card-front { transform: rotateY(180deg); }
      .card-visual.flipped .card-back { transform: rotateY(0deg); }
      .card-chip {
        width: 36px;
        height: 26px;
        border-radius: 6px;
        background: linear-gradient(145deg, #e8d48b, #c9a227);
        margin-bottom: 1.4rem;
      }
      .card-number-display {
        font-family: ui-monospace, Consolas, monospace;
        font-size: 1.15rem;
        letter-spacing: 0.12em;
        margin-bottom: 1.25rem;
      }
      .card-bottom { display: flex; justify-content: space-between; gap: 1rem; }
      .card-label {
        display: block;
        font-size: 0.62rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.75;
        margin-bottom: 0.15rem;
      }
      .card-value { font-size: 0.88rem; font-weight: 600; text-transform: uppercase; }
      .card-stripe { height: 36px; background: #1a1a1a; margin: 0.85rem -1.2rem 1rem; }
      .card-cvv-row { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; }
      .cvv-box {
        min-width: 3rem;
        background: #fff;
        color: #0f2922;
        border-radius: 6px;
        padding: 0.35rem 0.55rem;
        text-align: center;
        font-family: ui-monospace, Consolas, monospace;
      }

      .sample-btn {
        width: 100%;
        margin-bottom: 1rem;
        border: 1px dashed rgba(26, 95, 74, 0.35);
        background: #f4faf7;
        color: #1a5f4a;
        border-radius: 10px;
        padding: 0.55rem 0.75rem;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
      }
      .sample-btn:hover:not(:disabled) { background: #eaf6f0; }
      .sample-btn:disabled { opacity: 0.6; cursor: not-allowed; }

      .field { margin-bottom: 0.85rem; }
      .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .field label {
        display: block;
        margin-bottom: 0.3rem;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #46675f;
      }
      .field input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.72rem 0.85rem;
        border: 1px solid #d0e0d8;
        border-radius: 10px;
        font: inherit;
        background: #fbfcfb;
      }
      .field input:focus {
        outline: none;
        border-color: #1a5f4a;
        box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
        background: #fff;
      }
      .field-err { margin: 0.35rem 0 0; font-size: 0.78rem; color: #b91c1c; }

      .card-actions { display: flex; flex-direction: column; gap: 0.55rem; margin-top: 0.35rem; }
      .pay-btn {
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
  paymentReference = signal('');
  fieldError = signal<'name' | 'number' | 'expiry' | 'cvv' | ''>('');

  cardName = '';
  cardNumber = '';
  expiryDisplay = '';
  cvv = '';
  showBack = false;

  readonly usd = formatUsd;
  private readonly i18n = inject(LanguageService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  get formattedCardNumber(): string {
    return this.cardNumber.replace(/(.{4})/g, '$1 ').trim();
  }

  ngOnInit(): void {
    this.draftId = Number(this.route.snapshot.paramMap.get('draftId'));
    this.label.set(this.route.snapshot.queryParamMap.get('label') || 'Display plan');
    this.price.set(Number(this.route.snapshot.queryParamMap.get('price')) || 0);
    if (!this.draftId) {
      this.error.set('Invalid payment link.');
    }
  }

  formattedCardDisplay(): string {
    const raw = this.cardNumber.padEnd(16, '•');
    return raw.replace(/(.{4})/g, '$1 ').trim();
  }

  fillSample(): void {
    this.cardName = 'Jane Demo';
    this.cardNumber = '4242424242424242';
    this.expiryDisplay = '12/28';
    this.cvv = '123';
    this.fieldError.set('');
    this.error.set('');
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cardNumber = input.value.replace(/\D/g, '').slice(0, 16);
    input.value = this.formattedCardNumber;
  }

  onExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    this.expiryDisplay = raw;
    input.value = raw;
  }

  private validateCard(): boolean {
    this.fieldError.set('');
    if (!this.cardName.trim()) {
      this.fieldError.set('name');
      return false;
    }
    if (this.cardNumber.length !== 16) {
      this.fieldError.set('number');
      return false;
    }
    const [mm] = this.expiryDisplay.split('/');
    if (this.expiryDisplay.length < 5 || Number(mm) < 1 || Number(mm) > 12) {
      this.fieldError.set('expiry');
      return false;
    }
    if (this.cvv.length !== 3) {
      this.fieldError.set('cvv');
      return false;
    }
    return true;
  }

  payWithCard(): void {
    if (!this.draftId) return;
    if (!this.validateCard()) return;

    this.busy.set(true);
    this.error.set('');
    this.api.confirmPaymentMock(this.draftId).subscribe({
      next: (res) => {
        this.busy.set(false);
        if (isAwaitingApprovalPaymentResult(res)) {
          this.message.set(res.message || this.i18n.t('myEvents.cardSubmitSuccess'));
          if (res.referenceCode) {
            this.paymentReference.set(res.referenceCode);
          }
          setTimeout(() => void this.router.navigate(['/my-events']), 4500);
          return;
        }
        if (!res?.id) {
          this.error.set(this.i18n.t('myEvents.cardPayFailed'));
          return;
        }
        this.message.set(this.i18n.t('myEvents.cardSubmitSuccess'));
        void this.router.navigate(['/my-events']);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e.error?.message || this.i18n.t('myEvents.cardPayFailed'));
      }
    });
  }
}
