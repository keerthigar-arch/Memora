import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="success-hero">
      <div class="container">
        <h1>Payment Successful</h1>
        <p>Processing your event...</p>
      </div>
    </section>

    <div class="container success-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Creating your event...</p>
        </div>
      } @else if (error()) {
        <div class="error-card">
          <p class="error-msg">{{ error() }}</p>
          <a routerLink="/events" class="btn btn-primary">Back to events</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .success-hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .success-hero h1 { color: white; margin-bottom: 0.5rem; }
    .success-hero p { opacity: 0.9; margin: 0; }

    .success-container { max-width: 480px; margin: 0 auto; padding: 3rem 1.5rem; text-align: center; }
    .loading-state .spinner {
      width: 48px; height: 48px; border: 4px solid var(--border);
      border-top-color: var(--primary); border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-card { background: white; padding: 2rem; border-radius: var(--radius); box-shadow: var(--shadow); }
    .error-msg { color: #c53030; margin-bottom: 1rem; }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private stats = inject(EventStatsService);

  loading = signal(true);
  error = signal('');

  ngOnInit() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      this.error.set('Invalid return from payment. No session ID.');
      this.loading.set(false);
      return;
    }
    this.api.verifyStripeSession(sessionId).subscribe({
      next: (ev) => {
        this.stats.loadFromApi();
        this.loading.set(false);
        window.location.href = `${environment.customerPortalUrl}/event/${ev.id}`;
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to verify payment. Please contact support.');
        this.loading.set(false);
      }
    });
  }
}
