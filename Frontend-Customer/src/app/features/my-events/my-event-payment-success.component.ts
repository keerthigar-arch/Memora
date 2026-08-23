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
    <div class="success-page container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'myEvents.verifying' | t }}</p>
        </div>
      } @else if (error()) {
        <h1>{{ 'myEvents.payFailed' | t }}</h1>
        <p class="err">{{ error() }}</p>
        <a routerLink="/my-events" class="btn">{{ 'myEvents.back' | t }}</a>
      } @else {
        <h1>{{ 'myEvents.paySuccess' | t }}</h1>
        <p>{{ 'myEvents.paySuccessLede' | t }}</p>
        @if (paymentReference()) {
          <div class="ref-box" role="status">
            <span class="ref-label">{{ 'myEvents.paymentReference' | t }}</span>
            <strong class="ref-code">{{ paymentReference() }}</strong>
          </div>
        }
        <a routerLink="/my-events" class="btn">{{ 'myEvents.back' | t }}</a>
      }
    </div>
  `,
  styles: [
    `
      .success-page { padding: 2rem 1rem; max-width: 480px; text-align: center; }
      h1 { font-family: var(--font-display); color: #0f2922; }
      .btn {
        display: inline-block;
        margin: 1rem 0.5rem 0;
        padding: 0.65rem 1.2rem;
        background: #1a5f4a;
        color: #fff;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 700;
      }
      .err { color: #b91c1c; }
      .ref-box {
        margin: 1rem auto 0;
        max-width: 320px;
        padding: 0.9rem 1rem;
        border-radius: 12px;
        border: 1px solid #d8e3de;
        background: #f5f7f6;
        text-align: left;
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
      }
    `
  ]
})
export class MyEventPaymentSuccessComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  paymentReference = signal('');

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
}
