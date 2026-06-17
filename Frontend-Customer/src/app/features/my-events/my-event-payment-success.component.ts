import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-my-event-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="success-page container">
      @if (loading()) {
        <p>{{ 'myEvents.verifying' | t }}</p>
      } @else if (error()) {
        <h1>{{ 'myEvents.payFailed' | t }}</h1>
        <p class="err">{{ error() }}</p>
        <a routerLink="/my-events" class="btn">{{ 'myEvents.back' | t }}</a>
      } @else if (eventId()) {
        <h1>{{ 'myEvents.paySuccess' | t }}</h1>
        <p>{{ 'myEvents.paySuccessLede' | t }}</p>
        <a [routerLink]="['/event', eventId()]" class="btn">{{ 'myEvents.viewEvent' | t }}</a>
        <a routerLink="/my-events" class="link">{{ 'myEvents.back' | t }}</a>
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
      .link { display: block; margin-top: 1rem; color: #1a5f4a; }
      .err { color: #b91c1c; }
    `
  ]
})
export class MyEventPaymentSuccessComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  eventId = signal<number | null>(null);

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
      next: (ev) => {
        this.eventId.set(ev.id);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Payment verification failed.');
      }
    });
  }
}
