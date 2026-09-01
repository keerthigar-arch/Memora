import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, isAwaitingApprovalPaymentResult } from '../../services/api.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-my-event-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="success-page">
      <div class="container success-shell">
        <div class="page-back-bar page-back-bar--flush">
          <a routerLink="/my-events" [queryParams]="{ tab: 'pending' }" class="page-back">← {{ 'nav.back' | t }}</a>
        </div>

        @if (loading()) {
          <div class="status-card status-card--loading" role="status" aria-live="polite">
            <div class="spinner" aria-hidden="true"></div>
            <p class="status-title">{{ 'myEvents.verifying' | t }}</p>
            <p class="status-sub">{{ 'myEvents.paySuccessVerifyingSub' | t }}</p>
          </div>
        } @else if (error()) {
          <div class="status-card status-card--error" role="alert">
            <div class="status-icon status-icon--error" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
              </svg>
            </div>
            <h1 class="status-title">{{ 'myEvents.payFailed' | t }}</h1>
            <p class="status-sub err">{{ error() }}</p>
          </div>
        } @else {
          <article class="success-card">
            <div class="success-badge" aria-hidden="true">
              <span class="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </div>

            <header class="success-head">
              <h1>{{ 'myEvents.paySuccess' | t }}</h1>
              <p class="success-lede">{{ 'myEvents.paySuccessLede' | t }}</p>
            </header>

            @if (paymentReference()) {
              <div class="ref-panel">
                <span class="ref-label">{{ 'myEvents.paymentReference' | t }}</span>
                <div class="ref-row">
                  <code class="ref-code">{{ paymentReference() }}</code>
                  <button
                    type="button"
                    class="ref-copy"
                    (click)="copyReference()"
                    [attr.aria-label]="'myEvents.copyReference' | t"
                  >
                    @if (copied()) {
                      {{ 'myEvents.referenceCopied' | t }}
                    } @else {
                      {{ 'myEvents.copyReference' | t }}
                    }
                  </button>
                </div>
                <p class="ref-hint">{{ 'myEvents.approvalEmailHint' | t }}</p>
              </div>
            }

            <section class="timeline" aria-labelledby="success-next-title">
              <h2 id="success-next-title" class="timeline-title">{{ 'myEvents.paySuccessNext' | t }}</h2>
              <ol class="timeline-list">
                <li class="timeline-item timeline-item--done">
                  <span class="timeline-dot" aria-hidden="true"></span>
                  <div class="timeline-body">
                    <strong>{{ 'myEvents.paySuccessStepPaid' | t }}</strong>
                    <span>{{ 'myEvents.paySuccessStepPaidSub' | t }}</span>
                  </div>
                </li>
                <li class="timeline-item timeline-item--active">
                  <span class="timeline-dot" aria-hidden="true"></span>
                  <div class="timeline-body">
                    <strong>{{ 'myEvents.paySuccessStepReview' | t }}</strong>
                    <span>{{ 'myEvents.paySuccessStepReviewSub' | t }}</span>
                  </div>
                </li>
                <li class="timeline-item">
                  <span class="timeline-dot" aria-hidden="true"></span>
                  <div class="timeline-body">
                    <strong>{{ 'myEvents.paySuccessStepLive' | t }}</strong>
                    <span>{{ 'myEvents.paySuccessStepLiveSub' | t }}</span>
                  </div>
                </li>
              </ol>
            </section>

            <div class="success-actions">
              <a routerLink="/my-events" [queryParams]="{ tab: 'pending' }" class="btn btn-primary btn-lg success-cta">
                {{ 'myEvents.goToMyEvents' | t }}
              </a>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .success-page {
        padding: 0 0 3rem;
      }
      .success-shell {
        max-width: 520px;
        padding: 0 1rem;
      }

      .status-card {
        margin-top: 0.5rem;
        padding: 2.25rem 1.5rem;
        text-align: center;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: var(--shadow);
      }
      .status-card--loading .spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto 1rem;
      }
      .status-card--error {
        border-color: rgba(185, 28, 28, 0.2);
        background: linear-gradient(180deg, #fff 0%, #fef8f8 100%);
      }
      .status-icon {
        width: 52px;
        height: 52px;
        margin: 0 auto 1rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .status-icon svg {
        width: 28px;
        height: 28px;
      }
      .status-icon--error {
        background: rgba(185, 28, 28, 0.1);
        color: #b91c1c;
      }
      .status-title {
        margin: 0 0 0.35rem;
        font-family: var(--font-display);
        font-size: 1.35rem;
        color: #0f2922;
      }
      .status-sub {
        margin: 0;
        font-size: 0.9rem;
        color: #5a6f68;
        line-height: 1.5;
      }
      .err {
        color: #b91c1c;
      }

      .success-card {
        margin-top: 0.35rem;
        padding: 1.75rem 1.5rem 1.5rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: var(--shadow);
      }
      .success-badge {
        display: flex;
        justify-content: center;
        margin-bottom: 1rem;
      }
      .success-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(145deg, #1a5f4a 0%, #2d8f73 100%);
        color: #fff;
        box-shadow:
          0 4px 14px rgba(26, 95, 74, 0.35),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      .success-icon svg {
        width: 28px;
        height: 28px;
      }
      .success-head {
        text-align: center;
        margin-bottom: 1.35rem;
      }
      .success-head h1 {
        margin: 0 0 0.5rem;
        font-size: clamp(1.35rem, 3vw, 1.65rem);
        color: #0f2922;
      }
      .success-lede {
        margin: 0;
        font-size: 0.92rem;
        color: #5a6f68;
        line-height: 1.55;
        max-width: 28rem;
        margin-inline: auto;
      }

      .ref-panel {
        padding: 1rem 1.1rem;
        margin-bottom: 1.35rem;
        border-radius: 12px;
        border: 1px solid rgba(26, 95, 74, 0.18);
        background: linear-gradient(180deg, #f4faf7 0%, #eef6f2 100%);
      }
      .ref-label {
        display: block;
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: #3d6b5c;
        margin-bottom: 0.5rem;
      }
      .ref-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-wrap: wrap;
      }
      .ref-code {
        flex: 1;
        min-width: 0;
        font-family: ui-monospace, Consolas, Monaco, monospace;
        font-size: 1.05rem;
        font-weight: 600;
        color: #0d3d32;
        letter-spacing: 0.02em;
        word-break: break-all;
      }
      .ref-copy {
        flex-shrink: 0;
        padding: 0.4rem 0.75rem;
        font-size: 0.78rem;
        font-weight: 700;
        color: #1a5f4a;
        background: #fff;
        border: 1px solid rgba(26, 95, 74, 0.25);
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .ref-copy:hover {
        background: #f0f9f5;
        border-color: rgba(26, 95, 74, 0.4);
      }
      .ref-copy:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      .ref-hint {
        margin: 0.65rem 0 0;
        font-size: 0.8rem;
        color: #5a6f68;
        line-height: 1.45;
      }

      .timeline {
        padding-top: 0.15rem;
        margin-bottom: 1.35rem;
      }
      .timeline-title {
        margin: 0 0 0.85rem;
        font-family: var(--font-body);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: #5a6f68;
      }
      .timeline-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .timeline-item {
        display: flex;
        gap: 0.85rem;
        position: relative;
        padding-bottom: 1rem;
      }
      .timeline-item:last-child {
        padding-bottom: 0;
      }
      .timeline-item:not(:last-child)::before {
        content: '';
        position: absolute;
        left: 9px;
        top: 22px;
        bottom: 0;
        width: 2px;
        background: #dde8e3;
      }
      .timeline-item--done:not(:last-child)::before {
        background: linear-gradient(180deg, #2d8f73 0%, #dde8e3 100%);
      }
      .timeline-dot {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 2px;
        border-radius: 50%;
        border: 2px solid #c5d5ce;
        background: #fff;
        position: relative;
        z-index: 1;
      }
      .timeline-item--done .timeline-dot {
        border-color: #2d8f73;
        background: #2d8f73;
        box-shadow: inset 0 0 0 3px #fff;
      }
      .timeline-item--active .timeline-dot {
        border-color: #1a5f4a;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.15);
      }
      .timeline-body {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
      }
      .timeline-body strong {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f2922;
      }
      .timeline-body span {
        font-size: 0.82rem;
        color: #5a6f68;
        line-height: 1.45;
      }

      .success-actions {
        padding-top: 0.25rem;
      }
      .success-cta {
        width: 100%;
        justify-content: center;
      }
    `
  ]
})
export class MyEventPaymentSuccessComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  paymentReference = signal('');
  copied = signal(false);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      this.loading.set(false);
      this.error.set('Missing payment session.');
      return;
    }
    this.api.verifyStripeSession(sessionId).subscribe({
      next: (res) => {
        if (isAwaitingApprovalPaymentResult(res) && res.referenceCode) {
          this.paymentReference.set(res.referenceCode);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Payment verification failed.');
      }
    });
  }

  copyReference(): void {
    const code = this.paymentReference();
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }).catch(() => undefined);
  }
}
