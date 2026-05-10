import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AuthUiService } from '../../services/auth-ui.service';
import { labelForPricingSlug } from '../../constants/memora-event-types';

const RETURN_STORAGE_KEY = 'memora_pricing_return';

@Component({
  selector: 'app-pricing-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="order-page">
      <header class="order-hero">
        <div class="container">
          <p class="order-kicker">Memora · Pricing order</p>
          <h1>{{ mode() === 'card' ? 'Pay by card' : 'Direct payment order' }}</h1>
          <p class="order-lede">
            {{
              mode() === 'card'
                ? 'Enter your details, then continue to secure Stripe Checkout.'
                : 'Enter your details to receive an order reference for bank transfer or other direct payment.'
            }}
          </p>
        </div>
      </header>

      <div class="container order-shell">
        @if (!paramsOk()) {
          <div class="lift-card err-card" role="alert">
            <p>This order link is incomplete. Please choose a package from the pricing page.</p>
            <a routerLink="/pricing/obituary/srilanka" class="btn-primary">Go to pricing</a>
          </div>
        } @else if (loading()) {
          <div class="lift-card loading-card" aria-busy="true">
            <p>Loading package details…</p>
          </div>
        } @else if (loadError()) {
          <div class="lift-card err-card" role="alert">
            <p>{{ loadError() }}</p>
            <a [routerLink]="returnPricingLink()" class="btn-primary">Back to pricing</a>
          </div>
        } @else {
          <section class="lift-card summary-card">
            <h2 class="card-title">Package summary</h2>
            <ul class="summary-list">
              <li><span>Type</span><strong>{{ labelForPricingSlug(category()) }}</strong></li>
              <li><span>Region</span><strong>{{ countryDisplay() }}</strong></li>
              <li><span>Duration</span><strong>{{ packageDayLabel() }}</strong></li>
              <li><span>Word limit</span><strong>{{ wordLimit() }}</strong></li>
              <li class="price-line">
                <span>Price</span><strong>{{ amountDisplay() }} {{ currencyCode() }}</strong>
              </li>
            </ul>
          </section>

          <section class="lift-card form-card">
            <h2 class="card-title">Your contact details</h2>
            <div class="field-grid">
              <div class="field">
                <label for="cust-name">Full name <span class="req">*</span></label>
                <input id="cust-name" class="inp" [(ngModel)]="customerName" name="custName" required />
              </div>
              <div class="field">
                <label for="cust-phone">Phone <span class="req">*</span></label>
                <input id="cust-phone" class="inp" [(ngModel)]="customerPhone" name="custPhone" required />
              </div>
              <div class="field field-span">
                <label for="cust-email">Email <span class="req">*</span></label>
                <input
                  id="cust-email"
                  type="email"
                  class="inp"
                  [(ngModel)]="customerEmail"
                  name="custEmail"
                  required
                />
              </div>
            </div>

            @if (mode() === 'card') {
              <div class="stripe-panel">
                <h3 class="sub-title">Payment method</h3>
                <label class="radio-row">
                  <input type="radio" name="payOpt" checked disabled />
                  <span
                    ><strong>Card</strong> — powered by Stripe Checkout (Visa, Mastercard, and other cards).</span
                  >
                </label>
                <p class="hint">
                  You’ll confirm the amount on Stripe’s secure page. Your order reference is issued only after payment
                  succeeds.
                </p>
              </div>
            }

            @if (submitError()) {
              <div class="banner err" role="alert">{{ submitError() }}</div>
            }

            <div class="actions">
              <button type="button" class="btn-outline" (click)="goBackPricing()">Cancel</button>
              @if (mode() === 'direct') {
                <button type="button" class="btn-primary" [disabled]="submitting()" (click)="confirmDirect()">
                  {{ submitting() ? 'Submitting…' : 'Confirm order' }}
                </button>
              } @else {
                <button type="button" class="btn-primary" [disabled]="submitting()" (click)="proceedStripe()">
                  {{ submitting() ? 'Starting checkout…' : 'Proceed to payment' }}
                </button>
              }
            </div>
          </section>
        }
      </div>

      @if (showRefModal()) {
        <div class="modal-root" role="dialog" aria-modal="true" aria-labelledby="ref-dialog-title">
          <div class="modal-backdrop" (click)="closeRefModal()"></div>
          <div class="modal-panel lift-card">
            <h2 id="ref-dialog-title" class="modal-title">Your order reference</h2>
            <p class="modal-lede">
              Save this reference when you complete your bank transfer or send proof of payment to our team.
            </p>
            <div class="ref-box">
              <code>{{ referenceCode() }}</code>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-outline" (click)="copyReference()">Copy reference</button>
              <button type="button" class="btn-primary" (click)="closeRefModal()">Close</button>
            </div>
            @if (copyHint()) {
              <p class="copy-hint">{{ copyHint() }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .order-page {
        min-height: 100%;
        padding-bottom: 2.5rem;
      }
      .order-hero {
        padding: 1.25rem 0 0.5rem;
      }
      .order-kicker {
        margin: 0 0 0.35rem;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(26, 95, 74, 0.65);
      }
      .order-hero h1 {
        margin: 0 0 0.35rem;
        font-family: var(--font-display, serif);
        font-size: clamp(1.35rem, 3vw, 1.75rem);
        color: #14352e;
      }
      .order-lede {
        margin: 0;
        max-width: 52ch;
        font-size: 0.9rem;
        line-height: 1.55;
        color: #4a5e58;
      }
      .order-shell {
        padding-top: 0.75rem;
      }
      .lift-card {
        border-radius: 16px;
        border: 1px solid rgba(26, 95, 74, 0.12);
        background: rgba(255, 255, 255, 0.94);
        padding: 1.15rem 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 10px 28px rgba(13, 61, 50, 0.06);
      }
      .card-title {
        margin: 0 0 0.85rem;
        font-size: 1rem;
        color: #14352e;
      }
      .summary-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.45rem;
      }
      .summary-list li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        font-size: 0.88rem;
        color: #3d4f49;
      }
      .summary-list li span {
        color: rgba(61, 79, 73, 0.78);
      }
      .price-line {
        margin-top: 0.35rem;
        padding-top: 0.55rem;
        border-top: 1px dashed rgba(26, 95, 74, 0.18);
        font-weight: 600;
      }
      .field-grid {
        display: grid;
        gap: 0.75rem;
      }
      @media (min-width: 560px) {
        .field-grid {
          grid-template-columns: 1fr 1fr;
        }
        .field-span {
          grid-column: 1 / -1;
        }
      }
      .field label {
        display: block;
        font-size: 0.78rem;
        font-weight: 600;
        margin-bottom: 0.28rem;
        color: #2c3d38;
      }
      .req {
        color: #b42318;
      }
      .inp {
        width: 100%;
        padding: 0.48rem 0.65rem;
        border-radius: 10px;
        border: 1px solid rgba(26, 95, 74, 0.18);
        font-size: 0.88rem;
      }
      .stripe-panel {
        margin-top: 1rem;
        padding: 0.85rem;
        border-radius: 12px;
        background: rgba(248, 252, 250, 0.95);
        border: 1px solid rgba(26, 95, 74, 0.12);
      }
      .sub-title {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
        color: #14352e;
      }
      .radio-row {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.85rem;
        line-height: 1.45;
        color: #3d4f49;
      }
      .hint {
        margin: 0.55rem 0 0;
        font-size: 0.78rem;
        line-height: 1.5;
        color: rgba(61, 79, 73, 0.85);
      }
      .banner.err {
        margin-top: 0.85rem;
        padding: 0.55rem 0.65rem;
        border-radius: 10px;
        background: rgba(180, 35, 24, 0.08);
        border: 1px solid rgba(180, 35, 24, 0.22);
        color: #7a2714;
        font-size: 0.85rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin-top: 1rem;
        justify-content: flex-end;
      }
      .btn-primary,
      .btn-outline {
        border-radius: 999px;
        padding: 0.48rem 1.1rem;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .btn-primary {
        background: linear-gradient(145deg, #1a5f4a, #2d8f73);
        color: #fff;
      }
      .btn-primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .btn-outline {
        background: transparent;
        border-color: rgba(26, 95, 74, 0.28);
        color: #1a5f4a;
      }
      .err-card p {
        margin: 0 0 0.75rem;
      }
      .loading-card p {
        margin: 0;
      }
      .modal-root {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 42, 36, 0.45);
      }
      .modal-panel {
        position: relative;
        z-index: 1;
        max-width: 420px;
        width: 100%;
        margin: 0;
      }
      .modal-title {
        margin: 0 0 0.35rem;
        font-size: 1.05rem;
      }
      .modal-lede {
        margin: 0 0 0.75rem;
        font-size: 0.85rem;
        line-height: 1.5;
        color: #4a5e58;
      }
      .ref-box {
        padding: 0.65rem 0.75rem;
        border-radius: 10px;
        background: rgba(248, 252, 250, 0.95);
        border: 1px solid rgba(26, 95, 74, 0.15);
        margin-bottom: 0.85rem;
      }
      .ref-box code {
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        word-break: break-all;
        color: #14352e;
      }
      .modal-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .copy-hint {
        margin: 0.55rem 0 0;
        font-size: 0.78rem;
        color: #2d8f73;
      }
    `
  ]
})
export class PricingOrderComponent implements OnInit, OnDestroy {
  readonly labelForPricingSlug = labelForPricingSlug;

  category = signal('');
  country = signal('');
  pkgIndex = signal(-1);
  mode = signal<'direct' | 'card'>('direct');

  paramsOk = signal(false);
  loading = signal(true);
  loadError = signal('');

  countryDisplay = signal('');
  packageDayLabel = signal('');
  amountDisplay = signal('');
  wordLimit = signal('');
  currencyCode = signal('');

  customerName = '';
  customerPhone = '';
  customerEmail = '';

  submitting = signal(false);
  submitError = signal('');

  showRefModal = signal(false);
  referenceCode = signal('');
  copyHint = signal('');

  private sub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly authUi: AuthUiService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe((q) => {
      const cat = (q.get('category') || 'obituary').trim().toLowerCase();
      const ctry = (q.get('country') || 'srilanka').trim().toLowerCase();
      const pkgRaw = q.get('pkg');
      const modeRaw = (q.get('mode') || 'direct').trim().toLowerCase();
      const pkg = pkgRaw != null ? Number(pkgRaw) : NaN;

      this.category.set(cat);
      this.country.set(ctry);
      this.pkgIndex.set(pkg);
      this.mode.set(modeRaw === 'card' ? 'card' : 'direct');

      const ok = Number.isInteger(pkg) && pkg >= 0 && pkg <= 5;
      this.paramsOk.set(ok);
      if (!ok) {
        this.loading.set(false);
        return;
      }

      if (!this.auth.isLoggedIn()) {
        const qs = new URLSearchParams({
          category: cat,
          country: ctry,
          pkg: String(pkg),
          mode: modeRaw === 'card' ? 'card' : 'direct'
        });
        this.authUi.setPostAuthRedirect(`/pricing/order?${qs.toString()}`);
        this.authUi.openLogin();
        void this.router.navigate(['/pricing', cat, ctry]);
        return;
      }

      this.reloadPlan(cat, ctry, pkg);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  returnPricingLink(): string[] {
    return ['/pricing', this.category(), this.country()];
  }

  goBackPricing(): void {
    void this.router.navigate(this.returnPricingLink());
  }

  private reloadPlan(cat: string, ctry: string, pkg: number): void {
    this.loading.set(true);
    this.loadError.set('');
    this.api.getPricingPage(cat, ctry).subscribe({
      next: (p) => {
        if (pkg < 0 || pkg >= p.packageDays.length) {
          this.loadError.set('Invalid package column.');
          this.loading.set(false);
          return;
        }
        const priceRow = p.matrix.find((r) => r.feature.toLowerCase() === 'price');
        const wordRow = p.matrix.find((r) => r.feature.toLowerCase() === 'word limit');
        if (!priceRow || !wordRow || pkg >= priceRow.values.length) {
          this.loadError.set('Pricing data is incomplete.');
          this.loading.set(false);
          return;
        }
        this.countryDisplay.set(p.countryDisplayName);
        this.packageDayLabel.set(p.packageDays[pkg]);
        this.amountDisplay.set(priceRow.values[pkg]);
        this.wordLimit.set(wordRow.values[pkg]);
        this.currencyCode.set(p.currencyCode);
        const u = this.auth.currentUser();
        if (u) {
          if (!this.customerName.trim()) this.customerName = u.displayName || '';
          if (!this.customerEmail.trim()) this.customerEmail = u.email || '';
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load pricing. Try again later.');
        this.loading.set(false);
      }
    });
  }

  confirmDirect(): void {
    this.submitError.set('');
    if (!this.customerName.trim() || !this.customerPhone.trim() || !this.customerEmail.trim()) {
      this.submitError.set('Please fill in name, phone, and email.');
      return;
    }
    this.submitting.set(true);
    this.api
      .submitPricingDirectOrder({
        category: this.category(),
        country: this.country(),
        packageColumnIndex: this.pkgIndex(),
        customerName: this.customerName.trim(),
        customerPhone: this.customerPhone.trim(),
        customerEmail: this.customerEmail.trim()
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.referenceCode.set(res.reference);
          this.copyHint.set('');
          this.showRefModal.set(true);
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(err.error?.message || 'Could not create your order. Please try again.');
        }
      });
  }

  proceedStripe(): void {
    this.submitError.set('');
    if (!this.customerName.trim() || !this.customerPhone.trim() || !this.customerEmail.trim()) {
      this.submitError.set('Please fill in name, phone, and email.');
      return;
    }
    this.submitting.set(true);
    const path = `/pricing/${this.category()}/${this.country()}`;
    try {
      sessionStorage.setItem(RETURN_STORAGE_KEY, path);
    } catch {
      /* ignore */
    }

    this.api
      .createPricingCardCheckoutSession({
        category: this.category(),
        country: this.country(),
        packageColumnIndex: this.pkgIndex(),
        customerName: this.customerName.trim(),
        customerPhone: this.customerPhone.trim(),
        customerEmail: this.customerEmail.trim()
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (!res.url) {
            this.submitError.set('Checkout URL missing. Try again or use direct payment.');
            return;
          }
          window.location.href = res.url;
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(err.error?.message || 'Could not start card checkout. Try direct payment or try again.');
        }
      });
  }

  copyReference(): void {
    const ref = this.referenceCode();
    if (!ref) return;
    const hintOk = () => this.copyHint.set('Copied to clipboard.');
    const hintFail = () => this.copyHint.set('Copy blocked — select and copy the reference manually.');
    void navigator.clipboard.writeText(ref).then(hintOk).catch(() => {
      try {
        const ta = document.createElement('textarea');
        ta.value = ref;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        hintOk();
      } catch {
        hintFail();
      }
    });
  }

  closeRefModal(): void {
    this.showRefModal.set(false);
    void this.router.navigate(this.returnPricingLink());
  }
}
