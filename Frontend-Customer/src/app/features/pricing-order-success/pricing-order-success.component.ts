import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

const RETURN_STORAGE_KEY = 'memora_pricing_return';

@Component({
  selector: 'app-pricing-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="container shell">
        @if (busy()) {
          <div class="lift-card" aria-busy="true">
            <p>Confirming your payment…</p>
          </div>
        } @else if (error()) {
          <div class="lift-card err" role="alert">
            <h1 class="title">Payment could not be confirmed</h1>
            <p class="msg">{{ error() }}</p>
            <div class="actions">
              <a routerLink="/pricing/obituary/srilanka" class="btn-outline">Pricing</a>
              <a routerLink="/contact" class="btn-primary">Contact support</a>
            </div>
          </div>
        } @else if (showDialog()) {
          <div class="modal-root" role="dialog" aria-modal="true" aria-labelledby="ok-title">
            <div class="modal-backdrop"></div>
            <div class="modal-panel lift-card">
              <h1 id="ok-title" class="title">Payment successful</h1>
              <p class="lede">Your order reference — save this for your records:</p>
              <div class="ref-box">
                <code>{{ reference() }}</code>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-outline" (click)="copyRef()">Copy reference</button>
                <button type="button" class="btn-primary" (click)="finish()">Close</button>
              </div>
              @if (copyHint()) {
                <p class="hint">{{ copyHint() }}</p>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100%;
        padding: 2rem 0;
      }
      .lift-card {
        border-radius: 16px;
        border: 1px solid rgba(26, 95, 74, 0.12);
        background: rgba(255, 255, 255, 0.94);
        padding: 1.25rem;
        box-shadow: 0 10px 28px rgba(13, 61, 50, 0.06);
      }
      .lift-card.err .title {
        margin: 0 0 0.5rem;
        font-size: 1.15rem;
        color: #14352e;
      }
      .msg {
        margin: 0 0 1rem;
        font-size: 0.9rem;
        line-height: 1.55;
        color: #4a5e58;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .btn-primary,
      .btn-outline {
        display: inline-block;
        border-radius: 999px;
        padding: 0.48rem 1.1rem;
        font-size: 0.82rem;
        font-weight: 700;
        text-decoration: none;
        border: 1px solid transparent;
        cursor: pointer;
        text-align: center;
      }
      .btn-primary {
        background: linear-gradient(145deg, #1a5f4a, #2d8f73);
        color: #fff;
      }
      .btn-outline {
        background: transparent;
        border-color: rgba(26, 95, 74, 0.28);
        color: #1a5f4a;
      }
      .modal-root {
        position: fixed;
        inset: 0;
        z-index: 90;
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
        max-width: 440px;
        width: 100%;
      }
      .title {
        margin: 0 0 0.35rem;
        font-size: 1.15rem;
      }
      .lede {
        margin: 0 0 0.75rem;
        font-size: 0.88rem;
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
      .hint {
        margin: 0.55rem 0 0;
        font-size: 0.78rem;
        color: #2d8f73;
      }
    `
  ]
})
export class PricingOrderSuccessComponent implements OnInit {
  busy = signal(true);
  error = signal('');
  showDialog = signal(false);
  reference = signal('');
  copyHint = signal('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId?.trim()) {
      this.busy.set(false);
      this.error.set('Missing payment session. Return from Stripe Checkout or contact support.');
      return;
    }

    this.api.verifyPricingCardSession(sessionId.trim()).subscribe({
      next: (res) => {
        this.busy.set(false);
        if (!res.reference) {
          this.error.set('Reference was not issued. Please contact support.');
          return;
        }
        this.reference.set(res.reference);
        this.showDialog.set(true);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(
          err.error?.message ||
            'We could not verify this payment. If you were charged, contact support with your receipt.'
        );
      }
    });
  }

  copyRef(): void {
    const ref = this.reference();
    const ok = () => this.copyHint.set('Copied to clipboard.');
    void navigator.clipboard.writeText(ref).then(ok).catch(() => {
      try {
        const ta = document.createElement('textarea');
        ta.value = ref;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        ok();
      } catch {
        this.copyHint.set('Copy blocked — select and copy manually.');
      }
    });
  }

  finish(): void {
    let target = '/pricing/obituary/srilanka';
    try {
      const stored = sessionStorage.getItem(RETURN_STORAGE_KEY);
      if (stored?.startsWith('/')) target = stored;
      sessionStorage.removeItem(RETURN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    void this.router.navigateByUrl(target);
  }
}
